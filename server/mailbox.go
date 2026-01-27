package server

import (
	"errors"
	"sync"
	"time"
)

type queueData struct {
	messages   []string
	lastAccess time.Time
}

type Mailbox struct {
	mu         sync.Mutex
	queues     map[string]*queueData
	maxSize    int
	expiration time.Duration
}

func NewMailbox(maxSize int, expiration time.Duration) *Mailbox {
	m := &Mailbox{
		queues:     make(map[string]*queueData),
		maxSize:    maxSize,
		expiration: expiration,
	}

	go m.cleanupExpired()

	return m
}

func (m *Mailbox) Push(recipient string, payloads []string) error {
	if len(payloads) == 0 {
		return nil
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	if queue, ok := m.queues[recipient]; ok {
		newLen := len(queue.messages) + len(payloads)
		if newLen > m.maxSize {
			return errors.New("mailbox size exceeded")
		}

		queue.messages = append(queue.messages, payloads...)
		queue.lastAccess = time.Now()

		return nil
	}

	if len(payloads) > m.maxSize {
		return errors.New("mailbox size exceeded")
	}

	m.queues[recipient] = &queueData{
		messages:   append([]string{}, payloads...),
		lastAccess: time.Now(),
	}

	return nil
}

// Reads the mailbox and clears it
func (m *Mailbox) ReadAll(owner string) []string {
	m.mu.Lock()
	defer m.mu.Unlock()

	queue, ok := m.queues[owner]
	if !ok || len(queue.messages) == 0 {
		return []string{}
	}

	messages := queue.messages

	delete(m.queues, owner)

	return messages
}

func (m *Mailbox) cleanupExpired() {
	ticker := time.NewTicker(m.expiration / 2)
	defer ticker.Stop()

	for range ticker.C {
		m.mu.Lock()
		now := time.Now()

		// this is super locking, but okay for now
		for owner, queue := range m.queues {
			if now.Sub(queue.lastAccess) > m.expiration {
				delete(m.queues, owner)
			}
		}

		m.mu.Unlock()
	}
}
