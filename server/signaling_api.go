package server

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

type SignalingApi2 struct {
	pubsub *PubSub
	debug  bool
}

func NewSignalingApi2(pubsub *PubSub, debug bool) *SignalingApi2 {
	return &SignalingApi2{
		pubsub: pubsub,
		debug:  debug,
	}
}

func (s *SignalingApi2) Handler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.getHandler(w, r)
		return
	case http.MethodPost:
		s.postHandler(w, r)
		return
	default:
		s.writeResponse(w, http.StatusMethodNotAllowed, "expected GET or POST")
		return
	}
}

func (s *SignalingApi2) postHandler(w http.ResponseWriter, r *http.Request) {
	userId, err := extractUserId(r.URL.Path)
	if err != nil {
		s.writeResponse(w, http.StatusBadRequest, "invalid userId in path")
		return
	}

	if !s.pubsub.Has(userId) {
		s.debugf("SEND   %s: OFFLINE\n", userId)
		s.writeResponse(w, http.StatusOK, "offline")
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		s.writeResponse(w, http.StatusBadRequest, "malformed body")
		return
	}
	defer r.Body.Close()

	s.debugf("SEND   %s\n", userId)
	// s.debugf("SEND   %s: %s\n", userId, string(body))

	delivered := s.pubsub.Publish(userId, string(body))

	if !delivered {
		s.writeResponse(w, http.StatusOK, "offline")
		return
	}

	s.writeResponse(w, http.StatusOK, "ok")
}

func (s *SignalingApi2) getHandler(w http.ResponseWriter, r *http.Request) {
	userId, err := extractUserId(r.URL.Path)
	if err != nil {
		s.writeResponse(w, http.StatusBadRequest, "invalid userId in path")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*") // TODO

	ch, ok := s.pubsub.Subscribe(userId)
	if !ok {
		s.writeResponse(w, http.StatusBadRequest, "can't subscribe")
		return
	}
	defer s.pubsub.Unsubscribe(userId)

	flusher, ok := w.(http.Flusher)
	if !ok {
		s.writeResponse(w, http.StatusInternalServerError, "no flusher")
		return
	}

	keepalive := time.NewTicker(30 * time.Second)
	defer keepalive.Stop()

	s.debugf("LISTEN %s\n", userId)

	for {
		select {
		case msg, ok := <-*ch:
			if !ok {
				// channel closed
				return
			}

			fmt.Fprintf(w, "data: %s\n\n", msg)
			flusher.Flush()

		case <-keepalive.C:
			s.debugf("LISTEN %s\n", userId)
			// send keep-alive
			fmt.Fprintf(w, ": keep-alive\n\n")
			flusher.Flush()

		case <-r.Context().Done():
			// cleanup
			s.debugf("LEAVE  %s\n", userId)
			return
		}
	}
}

func (s *SignalingApi2) debugf(format string, a ...any) {
	if !s.debug {
		return
	}

	log.Printf(format, a...)
}

func (s *SignalingApi2) writeResponse(w http.ResponseWriter, status int, v string) {
	if status >= 400 {
		s.debugf("Error response: [%d]: %s", status, v)
	}

	w.WriteHeader(status)
	w.Write([]byte(v))
}

// Extract userId from path like /api/signaling/:userId
func extractUserId(path string) (string, error) {
	parts := strings.Split(strings.Trim(path, "/"), "/")

	if len(parts) < 3 {
		return "", fmt.Errorf("invalid path format")
	}

	userId := parts[len(parts)-1]
	if userId == "" {
		return "", fmt.Errorf("userId is empty")
	}

	return userId, nil
}
