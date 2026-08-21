package control

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/famerpro/core-server/internal/device"
	"github.com/gorilla/websocket"
)

func TestHubFanoutFromBrowserToAgent(t *testing.T) {
	registry := device.NewRegistry()
	hub := NewHub(registry, slog.Default())
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/agent":
			hub.HandleAgentWS(w, r)
		case "/browser":
			hub.HandleBrowserWS(w, r)
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	agent := dialWS(t, server.URL+"/agent?deviceId=device-01&sessionId=session-01")
	defer agent.Close()
	browser := dialWS(t, server.URL+"/browser")
	defer browser.Close()

	command := Command{
		CommandID: "cmd-1",
		DeviceID:  "device-01",
		Type:      ControlDown,
		XNorm:     0.25,
		YNorm:     0.5,
		PointerID: 7,
	}
	if err := browser.WriteJSON(command); err != nil {
		t.Fatalf("write browser command: %v", err)
	}

	var ack struct {
		Type    string  `json:"type"`
		Command Command `json:"command"`
	}
	if err := browser.ReadJSON(&ack); err != nil {
		t.Fatalf("read browser ack: %v", err)
	}
	if ack.Type != "ack" || ack.Command.Sequence == 0 || ack.Command.ExecuteAtMono == 0 {
		t.Fatalf("unexpected ack: %+v", ack)
	}
	if ack.Command.ControlEpoch == "" || ack.Command.SessionID != "session-01" {
		t.Fatalf("ack missing control fencing: %+v", ack.Command)
	}

	_, payload, err := agent.ReadMessage()
	if err != nil {
		t.Fatalf("read agent command: %v", err)
	}
	var dispatched Command
	if err := json.Unmarshal(payload, &dispatched); err != nil {
		t.Fatalf("decode agent command: %v", err)
	}
	if dispatched.CommandID != "cmd-1" || dispatched.DeviceID != "device-01" || dispatched.Sequence == 0 {
		t.Fatalf("unexpected dispatched command: %+v", dispatched)
	}
	if dispatched.ControlEpoch == "" || dispatched.SessionID != "session-01" {
		t.Fatalf("dispatched command missing control fencing: %+v", dispatched)
	}
}

func TestHubUsesLatestAgentSessionForDevice(t *testing.T) {
	registry := device.NewRegistry()
	hub := NewHub(registry, slog.Default())
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/agent":
			hub.HandleAgentWS(w, r)
		case "/browser":
			hub.HandleBrowserWS(w, r)
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	oldAgent := dialWS(t, server.URL+"/agent?deviceId=device-01&sessionId=session-old")
	defer oldAgent.Close()
	newAgent := dialWS(t, server.URL+"/agent?deviceId=device-01&sessionId=session-new")
	defer newAgent.Close()
	browser := dialWS(t, server.URL+"/browser")
	defer browser.Close()

	command := Command{
		CommandID: "cmd-1",
		DeviceID:  "device-01",
		Type:      ControlHome,
	}
	if err := browser.WriteJSON(command); err != nil {
		t.Fatalf("write browser command: %v", err)
	}

	var ack struct {
		Type    string  `json:"type"`
		Command Command `json:"command"`
	}
	if err := browser.ReadJSON(&ack); err != nil {
		t.Fatalf("read browser ack: %v", err)
	}
	if ack.Command.SessionID != "session-new" {
		t.Fatalf("expected latest session in ack, got %+v", ack.Command)
	}

	_, payload, err := newAgent.ReadMessage()
	if err != nil {
		t.Fatalf("read new agent command: %v", err)
	}
	var dispatched Command
	if err := json.Unmarshal(payload, &dispatched); err != nil {
		t.Fatalf("decode agent command: %v", err)
	}
	if dispatched.SessionID != "session-new" {
		t.Fatalf("expected latest session in command, got %+v", dispatched)
	}
}

func TestCoordinatorUsesDistinctEpochPerInstance(t *testing.T) {
	first := NewCoordinator()
	second := NewCoordinator()

	if first.Epoch() == "" || second.Epoch() == "" {
		t.Fatal("expected non-empty control epochs")
	}
	if first.Epoch() == second.Epoch() {
		t.Fatalf("expected distinct control epochs, got %q", first.Epoch())
	}
}

func dialWS(t *testing.T, rawURL string) *websocket.Conn {
	t.Helper()
	wsURL := "ws" + strings.TrimPrefix(rawURL, "http")
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial %s: %v", wsURL, err)
	}
	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	return conn
}
