# Signaling api

Errors

```go
type errorDTO struct {
	Error string `json:"error"`
}
```

## Send

`POST /api/signaling/send`

Request

```go
type sendDTO struct {
	From     string   `json:"from"`
	To       string   `json:"to"`
	Payloads []string `json:"payloads"`
}
```

Response

```go
type responseDTO struct {
	Payloads []string `json:"payloads"`
}
```

## Read

`POST /api/signaling/read`

Request

```go
type readDTO struct {
	For string `json:"for"`
}
```

Response

```go
type responseDTO struct {
	Payloads []string `json:"payloads"`
}
```
