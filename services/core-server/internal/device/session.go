package device

import "time"

type Session struct {
	DeviceID        string    `json:"deviceId"`
	SessionID       string    `json:"sessionId"`
	NodeID          string    `json:"nodeId"`
	ProtocolVersion string    `json:"protocolVersion"`
	AgentVersion    string    `json:"agentVersion"`
	ConnectedAt     time.Time `json:"connectedAt"`
	LastHeartbeatAt time.Time `json:"lastHeartbeatAt"`
}

func (s Session) Online(now time.Time) bool {
	return now.Sub(s.LastHeartbeatAt) < 20*time.Second
}
