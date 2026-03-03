package server

import (
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
)

type RunOpts struct {
	Host string
	Port int
	Fs   fs.FS
}

// TODO: limit body size
// TODO: set timeouts for requests (non-streaming)
func Run(opts RunOpts) {

	mux := http.NewServeMux()

	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/api/health", healthHandler)

	pubsub := NewPubsub()
	signalingApi2 := NewSignalingApi2(pubsub)
	mux.HandleFunc("/api/signaling/", signalingApi2.Handler)

	mux.Handle("/", serveFilesWith404Handling(opts.Fs))

	addr := fmt.Sprintf("%s:%d", opts.Host, opts.Port)

	serv := &http.Server{
		Handler: mux,
		Addr:    addr,
	}

	log.Printf("FPPS server is listening on %s\n", addr)
	err := serv.ListenAndServe()

	if err != nil {
		log.Printf("server listen and serve error: %s\n", err)
		os.Exit(1)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	io.WriteString(w, "OK")
}

func serveFilesWith404Handling(embedFs fs.FS) http.Handler {
	fileServer := http.FileServerFS(embedFs)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")

		if strings.HasPrefix(path, "assets") {
			// heavily cached assets
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			fileServer.ServeHTTP(w, r)
			return
		}

		// let go handle the rest.
		// unfortunately, these have no cache headers at all
		// as embedFs has no timestamps

		fileServer.ServeHTTP(w, r)
	})
}
