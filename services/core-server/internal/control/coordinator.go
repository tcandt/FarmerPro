package control

import "sync/atomic"

type Coordinator struct {
	next atomic.Uint64
}

func NewCoordinator() *Coordinator {
	return &Coordinator{}
}

func (c *Coordinator) Stamp(command Command) Command {
	command.Sequence = c.next.Add(1)
	return command
}
