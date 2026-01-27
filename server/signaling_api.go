package server

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
)

type Validatable interface {
	Validate() error
}

type sendDTO struct {
	Me       string   `json:"me"`
	Peer     string   `json:"peer"`
	Payloads []string `json:"payloads"`
}

func (d sendDTO) Validate() error {
	if d.Peer == "" || d.Me == "" || len(d.Payloads) == 0 {
		return errors.New("malformed values")
	}
	return nil
}

type readDTO struct {
	Me string `json:"me"`
}

func (d readDTO) Validate() error {
	if d.Me == "" {
		return errors.New("invalid data")
	}
	return nil
}

type responseDTO struct {
	Payloads []string `json:"payloads"`
}

type errorDTO struct {
	Error string `json:"error"`
}

func parseRequest(r *http.Request, v Validatable) error {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return fmt.Errorf("failed to read body: %w", err)
	}
	defer r.Body.Close()

	if err := json.Unmarshal(body, v); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	if err := v.Validate(); err != nil {
		return fmt.Errorf("failed to validate request: %w", err)
	}

	return nil
}

func writeResponse(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, message string) {
	if len(message) == 0 {
		panic("cant reply with empty error")
	}

	writeResponse(w, status, errorDTO{Error: message})
}

type SignalingApi struct {
	mailbox *Mailbox
}

func (routes *SignalingApi) sendHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "expected POST")
		return
	}

	var req sendDTO
	if err := parseRequest(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := routes.mailbox.Push(req.Peer, req.Payloads); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	payloads := routes.mailbox.ReadAll(req.Me)

	writeResponse(w, http.StatusOK, responseDTO{Payloads: payloads})

	// fmt.Printf("SEND from = %s, to = %s, payloadsSent = %d, payloadsRecieved = %d\n", req.Me, req.Peer, len(req.Payloads), len(payloads))
}

func (routes *SignalingApi) readHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "expected POST")
		return
	}

	var req readDTO
	if err := parseRequest(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	payloads := routes.mailbox.ReadAll(req.Me)

	writeResponse(w, http.StatusOK, responseDTO{Payloads: payloads})

	// fmt.Printf("READ from = %s, payloadsRecieved = %d\n", req.Me, len(payloads))
}
