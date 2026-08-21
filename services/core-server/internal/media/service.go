package media

import (
	"encoding/json"
	"net/http"
)

type Profile struct {
	Name        string `json:"name"`
	Width       int    `json:"width"`
	FPS         int    `json:"fps"`
	BitrateKbps int    `json:"bitrateKbps"`
	Selected    bool   `json:"selected"`
}

type Service struct{}

func NewService() *Service {
	return &Service{}
}

func (s *Service) HandleMedia(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	selected := r.URL.Query().Get("selected") == "true"
	supports60 := r.URL.Query().Get("supports60") == "true"
	profile := ResolveProfile(selected, supports60)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(profile)
}

func ResolveProfile(selected bool, supports60 bool) Profile {
	if !selected {
		return Profile{Name: "THUMB_STD", Width: 360, FPS: 15, BitrateKbps: 220}
	}
	if supports60 {
		return Profile{Name: "ACTIVE_60", Width: 720, FPS: 60, BitrateKbps: 3000, Selected: true}
	}
	return Profile{Name: "ACTIVE", Width: 720, FPS: 30, BitrateKbps: 1800, Selected: true}
}
