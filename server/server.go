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

	println("starting server on port 6173")
	err := http.ListenAndServe(":6173", mux)

	if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}
