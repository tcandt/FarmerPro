package control

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/famerpro/core-server/internal/device"
)

type Hub struct {
	registry    *device.Registry
	coordinator *Coordinator
	clock       Clock
}

func NewHub(registry *device.Registry) *Hub {
	return &Hub{
		registry:    registry,
		coordinator: NewCoordinator(),
		clock:       Clock{},
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

	command = h.coordinator.Stamp(command)
	command.ExecuteAtMono = h.clock.ExecuteAt(20 * time.Millisecond)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(command)
}
