package server

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

type RunOpts struct {
	Port  int
	Debug bool
}

// TODO: handle 404 with ugly workaround https://github.com/denpeshkov/greenlight/blob/c68f5a2111adcd5b1a65a06595acc93a02b6380e/internal/http/middleware.go#L16-L71
// TODO: limit body size
// TODO: set timeouts for requests
func Run(opts RunOpts) {

	mux := http.NewServeMux()

	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/api/health", healthHandler)

	pubsub := NewPubsub()
	signalingApi2 := NewSignalingApi2(pubsub, opts.Debug)
	mux.HandleFunc("/api/signaling/", signalingApi2.Handler)

	fileServer := http.FileServer(http.Dir("dist"))
	mux.Handle("/", fileServer)

	serv := &http.Server{
		Handler: mux,
		Addr:    fmt.Sprintf(":%d", opts.Port),
	}

	log.Printf("starting listening on port %d\n", opts.Port)
	err := serv.ListenAndServe()

	if err != nil {
		log.Printf("listen and server error: %s\n", err)
		os.Exit(1)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	io.WriteString(w, "OK")
}
