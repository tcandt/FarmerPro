package media

import "net/http"

type Service struct{}

func NewService() *Service {
	return &Service{}
}

func (s *Service) HandleMedia(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
	_, _ = w.Write([]byte("media router placeholder"))
}
