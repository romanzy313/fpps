package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// TODO: test failure cases

func doRead(api SignalingApi, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "http://example.com/api/signaling/read", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	api.readHandler(w, req)

	return w
}

func doSend(api SignalingApi, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "http://example.com/api/signaling/send", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	api.sendHandler(w, req)

	return w
}

func TestSmoke(t *testing.T) {
	mailbox := NewMailbox(10, time.Second*30)
	signalingApi := SignalingApi{mailbox: mailbox}

	w := doRead(signalingApi, `{"for":"user1"}`)

	if w.Code != http.StatusOK {
		t.Errorf("StatusCode = %d, want %d: %s", w.Code, http.StatusOK, w.Body.String())
	}

	want := `{"payloads":[]}`
	got := strings.TrimSpace(w.Body.String())
	if got != want {
		t.Errorf("Response body = %q, want %q", got, want)
	}
}

func TestSendAndRead(t *testing.T) {
	mailbox := NewMailbox(10, time.Second*30)
	signalingApi := SignalingApi{mailbox: mailbox}

	{
		w := doSend(signalingApi, `{"from":"user1","to":"user2","payloads":["msg1","msg2"]}`)
		if w.Code != http.StatusOK {
			t.Errorf("StatusCode = %d, want %d: %s", w.Code, http.StatusOK, w.Body.String())
		}
	}

	{
		w := doRead(signalingApi, `{"for":"user2"}`)

		want := `{"payloads":["msg1","msg2"]}`
		got := strings.TrimSpace(w.Body.String())
		if got != want {
			t.Errorf("Response body = %q, want %q", got, want)
		}
	}

	{
		w := doRead(signalingApi, `{"for":"user2"}`)

		want := `{"payloads":[]}`
		got := strings.TrimSpace(w.Body.String())
		if got != want {
			t.Errorf("Response body = %q, want %q", got, want)
		}
	}
}
