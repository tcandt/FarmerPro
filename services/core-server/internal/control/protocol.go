package control

type ControlType uint8

const (
	ControlUnknown ControlType = iota
	ControlDown
	ControlMove
	ControlUp
	ControlBack
	ControlHome
	ControlRecent
	ControlKey
	ControlProfileChange
	ControlPower
	ControlVolumeUp
	ControlVolumeDown
	ControlMute
)

type Command struct {
	CommandID       string      `json:"commandId"`
	Sequence        uint64      `json:"sequence"`
	GroupID         string      `json:"groupId,omitempty"`
	DeviceID        string      `json:"deviceId"`
	TargetDeviceIDs []string    `json:"targetDeviceIds,omitempty"`
	Type            ControlType `json:"type"`
	XNorm           float32     `json:"xNorm"`
	YNorm           float32     `json:"yNorm"`
	PointerID       uint32      `json:"pointerId"`
	CreatedAtMono   int64       `json:"createdAtMono"`
	GatewayAtMono   int64       `json:"gatewayAtMono"`
	ExecuteAtMono   int64       `json:"executeAtMono"`
}

func (c Command) Reliable() bool {
	return c.Type != ControlMove
}

func (c Command) Targets() []string {
	if len(c.TargetDeviceIDs) > 0 {
		return c.TargetDeviceIDs
	}
	if c.DeviceID == "" {
		return nil
	}
	return []string{c.DeviceID}
}
