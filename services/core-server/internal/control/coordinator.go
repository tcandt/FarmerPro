package control

import (
	"crypto/rand"
	"encoding/hex"
	"sync/atomic"
)

type Coordinator struct {
	next  atomic.Uint64
	epoch string
}

func NewCoordinator() *Coordinator {
	return &Coordinator{epoch: newControlEpoch()}
}

func (c *Coordinator) Stamp(command Command) Command {
	command.Sequence = c.next.Add(1)
	command.ControlEpoch = c.epoch
	return command
}

func (c *Coordinator) Epoch() string {
	return c.epoch
}

func newControlEpoch() string {
	var random [16]byte
	if _, err := rand.Read(random[:]); err != nil {
		return "epoch-unavailable"
	}
	return hex.EncodeToString(random[:])
}
