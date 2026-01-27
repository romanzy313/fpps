package server

import (
	"fmt"
	"io"
	"net/http"
	"os"
)

func okRoute(w http.ResponseWriter, r *http.Request) {
	io.WriteString(w, "OK")
}

func Run() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/health", okRoute)
	mux.HandleFunc("/health", okRoute)

	// TODO: handle 404
	// ugly workaround https://github.com/denpeshkov/greenlight/blob/c68f5a2111adcd5b1a65a06595acc93a02b6380e/internal/http/middleware.go#L16-L71
	fileServer := http.FileServer(http.Dir("dist"))
	mux.Handle("/", fileServer)

	println("starting server on port 6173")
	err := http.ListenAndServe(":6173", mux)

	if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}
