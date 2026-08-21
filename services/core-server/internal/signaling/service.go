package signaling

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

type SessionState string

const (
	StateNegotiating SessionState = "negotiating"
	StateReady       SessionState = "ready"
	StateClosed      SessionState = "closed"
)

type Session struct {
	SessionID string       `json:"sessionId"`
	DeviceID  string       `json:"deviceId"`
	Profile   string       `json:"profile"`
	State     SessionState `json:"state"`
	CreatedAt time.Time    `json:"createdAt"`
	ExpiresAt time.Time    `json:"expiresAt"`
	OfferSDP  string       `json:"offerSdp,omitempty"`
	AnswerSDP string       `json:"answerSdp,omitempty"`
}

type CreateSessionRequest struct {
	DeviceID string `json:"deviceId"`
	Profile  string `json:"profile"`
	OfferSDP string `json:"offerSdp,omitempty"`
}

type UpdateSessionRequest struct {
	AnswerSDP string       `json:"answerSdp,omitempty"`
	State     SessionState `json:"state,omitempty"`
}

type Service struct {
	mu       sync.RWMutex
	sessions map[string]Session
	now      func() time.Time
}

func NewService() *Service {
	return &Service{
		sessions: map[string]Session{},
		now:      time.Now,
	}
}

func (s *Service) HandleSignaling(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		s.create(w, r)
	case http.MethodGet:
		s.get(w, r)
	case http.MethodPatch:
		s.update(w, r)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *Service) create(w http.ResponseWriter, r *http.Request) {
	var request CreateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if request.DeviceID == "" {
		http.Error(w, "deviceId is required", http.StatusBadRequest)
		return
	}
	if request.Profile == "" {
		request.Profile = "ACTIVE"
	}

	now := s.now()
	session := Session{
		SessionID: "sig-" + now.Format("20060102150405.000000000"),
		DeviceID:  request.DeviceID,
		Profile:   request.Profile,
		State:     StateNegotiating,
		CreatedAt: now,
		ExpiresAt: now.Add(2 * time.Minute),
		OfferSDP:  request.OfferSDP,
	}

	s.mu.Lock()
	s.sessions[session.SessionID] = session
	s.mu.Unlock()

	writeJSON(w, http.StatusCreated, session)
}

func (s *Service) get(w http.ResponseWriter, r *http.Request) {
	sessionID := r.URL.Query().Get("sessionId")
	if sessionID == "" {
		http.Error(w, "sessionId is required", http.StatusBadRequest)
		return
	}

	s.mu.RLock()
	session, ok := s.sessions[sessionID]
	s.mu.RUnlock()
	if !ok {
		http.NotFound(w, r)
		return
	}

	writeJSON(w, http.StatusOK, session)
}

func (s *Service) update(w http.ResponseWriter, r *http.Request) {
	sessionID := r.URL.Query().Get("sessionId")
	if sessionID == "" {
		http.Error(w, "sessionId is required", http.StatusBadRequest)
		return
	}

	var request UpdateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	session, ok := s.sessions[sessionID]
	if !ok {
		http.NotFound(w, r)
		return
	}
	if request.AnswerSDP != "" {
		session.AnswerSDP = request.AnswerSDP
		session.State = StateReady
	}
	if request.State != "" {
		session.State = request.State
	}
	s.sessions[sessionID] = session

	writeJSON(w, http.StatusOK, session)
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
