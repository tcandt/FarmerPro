package control

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type outboundCommand struct {
	command Command
	payload []byte
}

type agentConn struct {
	deviceID  string
	sessionID string
	conn      *websocket.Conn
	send      chan outboundCommand

	mu         sync.Mutex
	closed     bool
	latestMove *outboundCommand
}

func newAgentConn(deviceID string, sessionID string, conn *websocket.Conn) *agentConn {
	return &agentConn{
		deviceID:  deviceID,
		sessionID: sessionID,
		conn:      conn,
		send:      make(chan outboundCommand, 128),
	}
}

func (a *agentConn) enqueue(command Command, payload []byte) {
	outbound := outboundCommand{command: command, payload: payload}
	a.mu.Lock()
	if a.closed {
		a.mu.Unlock()
		return
	}
	if !command.Reliable() {
		a.latestMove = &outbound
	}
	a.mu.Unlock()

	if !command.Reliable() {
		select {
		case a.send <- outbound:
		default:
		}
		return
	}

	select {
	case a.send <- outbound:
	default:
		a.close()
	}
}

func (a *agentConn) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer ticker.Stop()

	for {
		select {
		case outbound := <-a.send:
			if !outbound.command.Reliable() && !a.isLatestMove(outbound.command.CommandID) {
				continue
			}
			_ = a.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := a.conn.WriteMessage(websocket.BinaryMessage, outbound.payload); err != nil {
				a.close()
				return
			}
		case <-ticker.C:
			_ = a.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := a.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				a.close()
				return
			}
		}
	}
}

func (a *agentConn) readPump(onMessage func([]byte)) {
	defer a.close()
	a.conn.SetReadLimit(4096)
	_ = a.conn.SetReadDeadline(time.Now().Add(pongWait))
	a.conn.SetPongHandler(func(string) error {
		_ = a.conn.SetReadDeadline(time.Now().Add(pongWait))
		onMessage(nil)
		return nil
	})

	for {
		_, payload, err := a.conn.ReadMessage()
		if err != nil {
			return
		}
		onMessage(payload)
	}
}

func (a *agentConn) isLatestMove(commandID string) bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.latestMove == nil || a.latestMove.command.CommandID == commandID
}

func (a *agentConn) close() {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.closed {
		return
	}
	a.closed = true
	_ = a.conn.Close()
}
