package control

type ControlType uint8

const (
	ControlDown ControlType = iota + 1
	ControlMove
	ControlUp
	ControlBack
	ControlHome
	ControlRecent
)

type Command struct {
	CommandID     string      `json:"commandId"`
	Sequence      uint64      `json:"sequence"`
	GroupID       string      `json:"groupId"`
	DeviceID      string      `json:"deviceId"`
	Type          ControlType `json:"type"`
	XNorm         float32     `json:"xNorm"`
	YNorm         float32     `json:"yNorm"`
	PointerID     uint32      `json:"pointerId"`
	ExecuteAtMono int64       `json:"executeAtMono"`
}

func (c Command) Reliable() bool {
	return c.Type != ControlMove
}
