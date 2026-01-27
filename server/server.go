package server

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type RunOpts struct {
	Port int
}

// TODO: handle 404 with ugly workaround https://github.com/denpeshkov/greenlight/blob/c68f5a2111adcd5b1a65a06595acc93a02b6380e/internal/http/middleware.go#L16-L71
// TODO: limit body size
// TODO: set timeouts for requests
func Run(opts RunOpts) {
	mailbox := NewMailbox(10, time.Second*30)

	mux := http.NewServeMux()

	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/api/health", healthHandler)

	signalingApi := SignalingApi{mailbox: mailbox}
	mux.HandleFunc("/api/signaling/send", signalingApi.sendHandler)
	mux.HandleFunc("/api/signaling/read", signalingApi.readHandler)

	fileServer := http.FileServer(http.Dir("dist"))
	mux.Handle("/", fileServer)

	serv := &http.Server{
		Handler: mux,
		Addr:    fmt.Sprintf(":%d", opts.Port),
	}

	fmt.Printf("starting serving on port %d", opts.Port)
	err := serv.ListenAndServe()

	if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	io.WriteString(w, "OK")
}
