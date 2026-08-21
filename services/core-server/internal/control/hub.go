package control

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/famerpro/core-server/internal/device"
	"github.com/gorilla/websocket"
)

const (
	writeWait  = 5 * time.Second
	pongWait   = 30 * time.Second
	pingPeriod = 10 * time.Second
)

type Hub struct {
	registry    *device.Registry
	coordinator *Coordinator
	clock       Clock
	logger      *slog.Logger
	upgrader    websocket.Upgrader

	mu     sync.RWMutex
	agents map[string]*agentConn
}

func NewHub(registry *device.Registry, logger *slog.Logger) *Hub {
	return &Hub{
		registry:    registry,
		coordinator: NewCoordinator(),
		clock:       Clock{},
		logger:      logger,
		agents:      map[string]*agentConn{},
		upgrader: websocket.Upgrader{
			CheckOrigin: func(*http.Request) bool { return true },
		},
	}
}

func (h *Hub) HandleControl(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var command Command
	if err := json.NewDecoder(r.Body).Decode(&command); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	dispatched, err := h.dispatch(command)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(dispatched)
}

func (h *Hub) HandleBrowserWS(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		h.logger.Warn("browser websocket upgrade failed", "error", err)
		return
	}
	defer conn.Close()

	conn.SetReadLimit(64 * 1024)
	_ = conn.SetReadDeadline(time.Now().Add(pongWait))
	conn.SetPongHandler(func(string) error {
		_ = conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		messageType, payload, err := conn.ReadMessage()
		if err != nil {
			return
		}
		if messageType != websocket.TextMessage && messageType != websocket.BinaryMessage {
			continue
		}

		var command Command
		if err := json.Unmarshal(payload, &command); err != nil {
			_ = writeJSON(conn, map[string]any{"type": "error", "error": err.Error()})
			continue
		}

		dispatched, err := h.dispatch(command)
		if err != nil {
			_ = writeJSON(conn, map[string]any{"type": "error", "error": err.Error(), "commandId": command.CommandID})
			continue
		}
		_ = writeJSON(conn, map[string]any{"type": "ack", "command": dispatched})
	}
}

func (h *Hub) HandleAgentWS(w http.ResponseWriter, r *http.Request) {
	deviceID := r.URL.Query().Get("deviceId")
	if deviceID == "" {
		http.Error(w, "deviceId is required", http.StatusBadRequest)
		return
	}

	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		h.logger.Warn("agent websocket upgrade failed", "deviceId", deviceID, "error", err)
		return
	}

	agent := newAgentConn(deviceID, conn)
	h.registerAgent(agent)
	defer h.unregisterAgent(agent)

	h.registry.Upsert(device.Session{
		DeviceID:        deviceID,
		SessionID:       r.URL.Query().Get("sessionId"),
		NodeID:          r.URL.Query().Get("nodeId"),
		ProtocolVersion: r.URL.Query().Get("protocolVersion"),
		AgentVersion:    r.URL.Query().Get("agentVersion"),
	})

	go agent.writePump()
	agent.readPump(func() {
		h.registry.Heartbeat(deviceID)
	})
}

func (h *Hub) dispatch(command Command) (Command, error) {
	if command.Type == ControlUnknown {
		return Command{}, errors.New("control type is required")
	}

	command = h.coordinator.Stamp(command)
	command.GatewayAtMono = time.Now().UnixNano()
	command.ExecuteAtMono = h.clock.ExecuteAt(20 * time.Millisecond)

	targets := command.Targets()
	if len(targets) == 0 {
		return Command{}, errors.New("at least one target device is required")
	}

	payload, err := json.Marshal(command)
	if err != nil {
		return Command{}, err
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, deviceID := range targets {
		agent := h.agents[deviceID]
		if agent == nil {
			continue
		}
		agent.enqueue(command, payload)
	}

	return command, nil
}

func (h *Hub) registerAgent(agent *agentConn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if old := h.agents[agent.deviceID]; old != nil {
		old.close()
	}
	h.agents[agent.deviceID] = agent
	h.logger.Info("agent connected", "deviceId", agent.deviceID)
}

func (h *Hub) unregisterAgent(agent *agentConn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.agents[agent.deviceID] == agent {
		delete(h.agents, agent.deviceID)
	}
	agent.close()
	h.logger.Info("agent disconnected", "deviceId", agent.deviceID)
}

func writeJSON(conn *websocket.Conn, value any) error {
	_ = conn.SetWriteDeadline(time.Now().Add(writeWait))
	return conn.WriteJSON(value)
}

func pingLoop(conn *websocket.Conn, done <-chan struct{}) {
	ticker := time.NewTicker(pingPeriod)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			_ = conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		case <-done:
			return
		}
	}
}
