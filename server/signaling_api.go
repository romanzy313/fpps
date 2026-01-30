package server

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type SignalingApi2 struct {
	pubsub *PubSub
}

func NewSignalingApi2(pubsub *PubSub) *SignalingApi2 {
	return &SignalingApi2{
		pubsub: pubsub,
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
		writeResponse(w, http.StatusMethodNotAllowed, "expected GET or POST")
		return
	}
}

func writeResponse(w http.ResponseWriter, status int, v string) {
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

func (s *SignalingApi2) postHandler(w http.ResponseWriter, r *http.Request) {
	userId, err := extractUserId(r.URL.Path)
	if err != nil {
		writeResponse(w, http.StatusBadRequest, "invalid userId in path")
		return
	}

	fmt.Printf("SEND   %s\n", userId)

	if !s.pubsub.Has(userId) {
		writeResponse(w, http.StatusOK, "offline")
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeResponse(w, http.StatusBadRequest, "malformed body")
		return
	}
	defer r.Body.Close()

	delivered := s.pubsub.Publish(userId, string(body))

	if !delivered {
		writeResponse(w, http.StatusOK, "offline")
		return
	}

	writeResponse(w, http.StatusOK, "ok")
}

func (s *SignalingApi2) getHandler(w http.ResponseWriter, r *http.Request) {
	userId, err := extractUserId(r.URL.Path)
	if err != nil {
		writeResponse(w, http.StatusBadRequest, "invalid userId in path")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*") // TODO

	ch, ok := s.pubsub.Subscribe(userId)
	if !ok {
		writeResponse(w, http.StatusBadRequest, "can't subscribe")
		return
	}
	defer s.pubsub.Unsubscribe(userId)

	flusher, ok := w.(http.Flusher)
	if !ok {
		writeResponse(w, http.StatusInternalServerError, "no flusher")
		return
	}

	keepalive := time.NewTicker(30 * time.Second)
	defer keepalive.Stop()

	fmt.Printf("LISTEN %s\n", userId)

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
			fmt.Printf("LISTEN %s\n", userId)
			// send keep-alive
			fmt.Fprintf(w, ": keep-alive\n\n")
			flusher.Flush()

		case <-r.Context().Done():
			// cleanup
			fmt.Printf("LEAVE  %s\n", userId)
			return
		}
	}
}
