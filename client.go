// ...existing code...
package main

import (
	"bytes"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait   = 1 * time.Second
	pongWait    = 30 * time.Second
	pingPeriod  = (pongWait * 9) / 10
	maxMsgSize  = 1024 * 4
	sendBufSize = 1 // keep very small to avoid buffering/delay
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

// permissive upgrader (adjust CheckOrigin as needed)
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Client represents a single websocket connection.
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
}

func (c *Client) enableTCPNoDelay() {
	if tcpConn, ok := c.conn.UnderlyingConn().(*net.TCPConn); ok {
		_ = tcpConn.SetNoDelay(true)
	}
}

// readLoop reads messages from the websocket and forwards them immediately to the hub.
func (c *Client) readLoop() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMsgSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, msg, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("ws read error: %v", err)
			}
			return
		}
		msg = bytes.TrimSpace(bytes.ReplaceAll(msg, newline, space))
		// deliver immediately to hub
		c.hub.broadcast <- msg
	}
}

// writeLoop writes messages to the websocket immediately (no batching).
func (c *Client) writeLoop() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			// ensure we don't block forever
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// serveWs upgrades HTTP to websocket and starts the read/write loops.
func serveWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade error:", err)
		return
	}
	client := &Client{
		hub:  hub,
		conn: conn,
		send: make(chan []byte, sendBufSize),
	}
	client.enableTCPNoDelay()
	client.hub.register <- client

	go client.writeLoop()
	go client.readLoop()
}
