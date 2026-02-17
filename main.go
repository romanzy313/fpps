package main

import (
	"embed"
	"ffps/server"
	"io/fs"
	"os"
	"strconv"
)

//go:embed dist
var webapp embed.FS

func main() {
	var port int
	if os.Getenv("PORT") != "" {
		port, _ = strconv.Atoi(os.Getenv("PORT"))
	} else {
		port = 3000
	}

	Fs, err := fs.Sub(webapp, "dist")
	if err != nil {
		panic(err)
	}

	server.Run(server.RunOpts{
		Port:  port,
		Fs:    Fs,
		Debug: true,
	})
}
