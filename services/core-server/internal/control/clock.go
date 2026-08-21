package control

import "time"

type Clock struct{}

func (Clock) ExecuteAt(leadTime time.Duration) int64 {
	return time.Now().Add(leadTime).UnixNano()
}
