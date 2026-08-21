package signaling

import "net/http"

type Service struct{}

func NewService() *Service {
	return &Service{}
}

func (s *Service) HandleSignaling(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
	_, _ = w.Write([]byte("webrtc signaling placeholder"))
}
