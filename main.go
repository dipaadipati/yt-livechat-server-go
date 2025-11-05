package main

import (
	"flag"
	"log"
	"net/http"
	"os"
)

var ws_addr = flag.String("ws_addr", ":8080", "websocket service address")
var http_addr = flag.String("http_addr", ":3000", "http service address")

func servEmojisApi(w http.ResponseWriter, r *http.Request) {
	fileInfos, err := os.ReadDir("./emojis")
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	emojis := make(map[string]string)
	for _, fileInfo := range fileInfos {
		if fileInfo.Name() == ".gitkeep" {
			continue
		}
		name := fileInfo.Name()
		ext := ""
		for i := len(name) - 1; i >= 0; i-- {
			if name[i] == '.' {
				ext = name[i:]
				name = name[:i]
				break
			}
		}
		emojis[name] = "/emojis/" + fileInfo.Name()
		ext += ""
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"emojis": {`))
	first := true
	for k, v := range emojis {
		if !first {
			w.Write([]byte(`,`))
		}
		w.Write([]byte(`"` + k + `":"` + v + `"`))
		first = false
	}
	w.Write([]byte(`}}`))
}

func servEmojis(w http.ResponseWriter, r *http.Request) {
	filePath := "./emojis" + r.URL.Path[len("/emojis/")-1:]
	http.ServeFile(w, r, filePath)
}

func main() {
	flag.Parse()

	hub := newHub()
	go hub.run()

	// WebSocket server mux (contoh path /ws untuk websocket)
	wsMux := http.NewServeMux()
	wsMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})

	// Static file server mux (port terpisah)
	fileMux := http.NewServeMux()
	fileMux.Handle("/", http.FileServer(http.Dir("./public")))

	fileMux.HandleFunc("/api/emojis", servEmojisApi)
	fileMux.HandleFunc("/emojis/", servEmojis)

	wsSrv := &http.Server{Addr: *ws_addr, Handler: wsMux}
	httpSrv := &http.Server{Addr: *http_addr, Handler: fileMux}

	errCh := make(chan error, 2)

	go func() {
		errCh <- wsSrv.ListenAndServe()
	}()

	go func() {
		log.Println("Starting http server on http://localhost" + *http_addr)
		errCh <- httpSrv.ListenAndServe()
	}()

	// Jika salah satu server error, keluar
	log.Fatal(<-errCh)
}
