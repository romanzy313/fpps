package main

import "ffps/server"

func main() {
	// TODO: port from env
	port := 6173

	server.Run(server.RunOpts{
		Port:  port,
		Debug: true,
	})
}
