package device

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

type Registry struct {
	mu       sync.RWMutex
	sessions map[string]Session
}

func NewRegistry() *Registry {
	return &Registry{sessions: map[string]Session{}}
}

func (r *Registry) Upsert(session Session) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if session.ConnectedAt.IsZero() {
		session.ConnectedAt = time.Now()
	}
	session.LastHeartbeatAt = time.Now()
	r.sessions[session.DeviceID] = session
}

func (r *Registry) List() []Session {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]Session, 0, len(r.sessions))
	for _, session := range r.sessions {
		out = append(out, session)
	}
	return out
}

func (r *Registry) HandleDevices(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(r.List())
}
