package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/famerpro/core-server/internal/control"
	"github.com/famerpro/core-server/internal/device"
	"github.com/famerpro/core-server/internal/media"
	"github.com/famerpro/core-server/internal/signaling"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	registry := device.NewRegistry()
	hub := control.NewHub(registry, logger)
	signals := signaling.NewService()
	mediaService := media.NewService()

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("/v1/devices", registry.HandleDevices)
	mux.HandleFunc("/v1/control", hub.HandleControl)
	mux.HandleFunc("/v1/control/browser", hub.HandleBrowserWS)
	mux.HandleFunc("/v1/control/agent", hub.HandleAgentWS)
	mux.HandleFunc("/v1/signaling", signals.HandleSignaling)
	mux.HandleFunc("/v1/media", mediaService.HandleMedia)

	logger.Info("starting famerpro core server", "addr", ":8080")
	if err := http.ListenAndServe(":8080", withCORS(mux)); err != nil {
		logger.Error("server stopped", "error", err)
		os.Exit(1)
	}
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
