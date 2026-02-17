package main

import (
	"ffps/server"
	"os"
	"strconv"
)

func main() {
	var port int
	if os.Getenv("PORT") != "" {
		port, _ = strconv.Atoi(os.Getenv("PORT"))
	} else {
		port = 3000
	}

	server.Run(server.RunOpts{
		Port:  port,
		Debug: true,
	})
}
