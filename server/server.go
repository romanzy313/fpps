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

	messaging := NewMessaging()
	signalingApi2 := NewSignalingApi(messaging)
	signalingApi2.Register(mux)

	mux.Handle("/", serveFilesWithCaching(opts.Fs))

	addr := fmt.Sprintf("%s:%d", opts.Host, opts.Port)

	serv := &http.Server{
		Handler: mux,
		Addr:    addr,
	}

	log.Printf("File Transfer server is listening on %s\n", addr)
	err := serv.ListenAndServe()

	if err != nil {
		log.Printf("server listen and serve error: %s\n", err)
		os.Exit(1)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	io.WriteString(w, "OK")
}

func serveFilesWithCaching(embedFs fs.FS) http.Handler {
	fileServer := http.FileServerFS(embedFs)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")

		if strings.HasPrefix(path, "assets") {
			// heavily cached assets
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			fileServer.ServeHTTP(w, r)
			return
		}

		// go will handle the rest of the files.
		// unfortunately, these will have no cache headers as embedFs has no timestamps...

		fileServer.ServeHTTP(w, r)
	})
}
