package server

import (
	"sync"
)

type PubSub struct {
	mu    sync.Mutex
	users map[string]*chan string
}

func NewPubsub() *PubSub {
	return &PubSub{
		users: make(map[string]*chan string),
	}
}

func (p *PubSub) Has(user string) bool {
	p.mu.Lock()
	defer p.mu.Unlock()

	_, exists := p.users[user]

	return exists
}

// client can publish to user
func (p *PubSub) Publish(user string, data string) bool {
	p.mu.Lock()
	defer p.mu.Unlock()

	ch, exists := p.users[user]
	if !exists {
		return false
	}

	select {
	case *ch <- data:
		return true
	default:
		return false
	}
}

func (p *PubSub) Subscribe(user string) (*chan string, bool) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if _, exists := p.users[user]; exists {
		return nil, false
	}

	c := make(chan string, 4)
	p.users[user] = &c

	return &c, true
}

func (p *PubSub) Unsubscribe(user string) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if ch, exists := p.users[user]; exists {
		close(*ch)
		delete(p.users, user)
	}
}
