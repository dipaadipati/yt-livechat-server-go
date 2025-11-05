# YouTube Live Chat Server (Golang Version)

Golang port dari aplikasi untuk scrape YouTube Live Chat secara real-time dan mengirim data melalui WebSocket.

## 📋 Fitur

- ✅ Scrape live chat YouTube secara real-time
- ✅ WebSocket server untuk broadcast chat ke multiple clients
- ✅ HTTP server untuk menampilkan chat di browser
- ✅ Support emoji custom
- ✅ Support member badge & moderator badge
- ✅ Chat history (max 100 pesan)
- ✅ Auto-reconnect ke server

## 🛠️ Requirement

- **Go** v1.20+ (download dari https://go.dev/)
- **Microsoft Edge WebView2 Runtime** (biasanya sudah terinstall di Windows 10/11)
- **Tampermonkey** browser extension (Chrome, Firefox, dll)

## 📦 Installation

### 1. Setup Go Server

```bash
# Clone atau download project ini
git clone https://github.com/dipaadipati/yt-livechat-server-go.git

# Pindah lokasi
cd yt-livechat-server-go

# Install dependencies
go mod tidy
```

### 2. Install Tampermonkey (Jika tanpa WebView2)

- **Chrome**: https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
- **Firefox**: https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/

### 3. Setup Tampermonkey Script (Jika tanpa WebView2)

1. Buka extension Tampermonkey di browser
2. Klik **Create a new script**
3. Copy-paste isi dari [tampermonkey_script.js](tampermonkey_script.js)
4. Save script (Ctrl + S)

## 🚀 Cara Menggunakan

### Step 1: Jalankan Server

```bash
go run .
# atau "go run . -video_id=VIDEO_ID" jika menggunakan WebView2
```

Output yang benar:
```
Masukkan YouTube Video ID: VIDEO_ID_INPUT
Starting http server on http://localhost:3000
```

### Step 2: Buka YouTube Live Chat (Jika tanpa WebView2)

1. Buka YouTube Live Chat di tab browser
2. Pastikan Tampermonkey script sudah aktif
3. Buka browser console (F12) untuk melihat debug log
4. Tunggu sampai muncul: `[YT Chat] Connected to WebSocket server`

### Step 3: Lihat Chat

**Opsi A: Browser**
- Buka `http://localhost:3000` di browser baru
- Chat akan muncul real-time

**Opsi B: OBS**
1. Buka OBS Studio
2. Add Source → **Browser**
3. URL: `http://localhost:3000`
4. Width: 500 (dapat disesuaikan)
5. Height: 600 (dapat disesuaikan)
6. Centang **Shutdown source when not visible** (optional)

## ⚙️ Struktur Folder

```
│ yt-livechat-server-go
├── main.go                # Main WebSocket + HTTP server
├── client.go              # WebSocket client handling
├── browser.go             # Headless YouTube Browser
├── hub.go                 # WebSocket hub for broadcasting
├── tampermonkey_script.js # Script untuk scrape YouTube
├── public/
│   ├── index.html         # UI untuk menampilkan chat
│   ├── script.js          # Frontend logic
│   └── style.css          # Styling
├── emojis/                # Folder untuk custom emoji (optional)
├── go.mod                 # Go module definition
├── go.sum                 # Go module checksums
└── README.md              # File ini
```

## 🎯 Konfigurasi (optional)

### Ubah Port Server

Edit di `main.go`:
```go
var ws_addr = flag.String("ws_addr", ":8080", "websocket service address")
var http_addr = flag.String("http_addr", ":3000", "http service address")
```

Atau gunakan flag saat menjalankan:
```bash
go run . -ws_addr=":8081" -http_addr=":3001"
```

### Custom Emoji

1. Buat folder `emojis` di root project
2. Taruh file emoji (.png, .jpg, .webp) ke sana
3. Nama file harus sesuai dengan kode emoji di chat
   - Contoh: `YT_emote1.webp` → `YT_emote1` di chat akan diganti gambar

## ⚠️ Known Issues & Solusi

### ❌ Problem 1: "WebSocket is closed" Error

**Penyebab:** Server tidak running atau port terblokir

**Solusi:**
```bash
# Pastikan server sudah running
go run .

# Cek apakah port 8080 & 3000 tidak terpakai
# Windows:
netstat -ano | findstr :8080
netstat -ano | findstr :3000
```

## 📱 API Endpoints

```bash
# Get all emoji mappings
GET http://localhost:3000/api/emojis

# Get specific emoji
GET http://localhost:3000/emojis/emoji_name.png

# WebSocket Connection
WS ws://localhost:8080/
```

## 📝 Changelog

### v2.0
- Add headless browser system without use any active browser tabs

### v1.0
- Initial release Go version
- Basic scrape & broadcast
- Support custom emoji
- Separate WebSocket (8080) and HTTP (3000) servers

## 🤝 Support

Jika ada masalah:
1. Cek console F12 untuk error message
2. Restart server & browser
3. Cek firewall & antivirus tidak memblokir

## 📄 License

Free to use for personal & streaming purpose

---

**Author:** Adipati Rezkya
**Last Updated:** November 6, 2025