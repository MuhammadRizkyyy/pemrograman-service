# Toko Sepatu - Rate Limiting & Service Integration
## Pertemuan 10 - Pemrograman Berbasis Service

Aplikasi toko sepatu dengan 2 service yang terintegrasi:
- **Service A**: Node.js/Express Gateway dengan Rate Limiting
- **Service B**: PHP Native untuk CRUD Database

---

## Arsitektur

```
Client
  |
  v
Service A (Node.js) - Port 34500
  |  Rate Limiting: 5 req/menit
  v
Service B (PHP) - Port 34501
  |
  v
MySQL Database - Port 34502
```

---

## Quick Start dengan Docker

### Prasyarat
- Docker & Docker Compose terinstall
- Port 34500, 34501, 34502, 34503 tersedia

### Jalankan Semua Service

```bash
# Clone repo
git clone https://github.com/MuhammadRizkyyy/pemrograman-service.git
cd pemrograman-service/Pertemuan\ 10/tugas/sepatu-app

# Build dan jalankan semua container
docker compose up -d --build

# Cek status container
docker compose ps

# Lihat logs
docker compose logs -f
```

### Stop & Hapus Container

```bash
# Stop semua container
docker compose down

# Stop dan hapus volume (database akan terhapus)
docker compose down -v
```

---

## Service yang Berjalan

| Service | Port | URL | Deskripsi |
|---------|------|-----|-----------|
| Service A | 34500 | http://103.147.92.134:34500 | Node.js Gateway dengan Rate Limiting |
| Service B | 34501 | http://103.147.92.134:34501 | PHP Backend untuk CRUD |
| MySQL | 34502 | localhost:34502 | Database |
| phpMyAdmin | 34503 | http://103.147.92.134:34503 | Web UI untuk database |

---

## Service A - Node.js/Express

### Fitur
- Rate Limiting: **maksimal 5 request per menit** per IP
- Proxy semua request ke Service B
- Response 429 jika melebihi batas
- CORS enabled

### Environment Variables
```env
PORT=34500
SERVICE_B_URL=http://service-b:34501
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=5
```

### Endpoints (via Service A)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | / | Health check Service A |
| GET | /api/sepatu | Ambil semua sepatu |
| GET | /api/sepatu/:id | Ambil sepatu by ID |
| POST | /api/sepatu | Tambah sepatu baru |
| PUT | /api/sepatu/:id | Update sepatu |
| DELETE | /api/sepatu/:id | Hapus sepatu |
| GET | /api/orders | Ambil semua orders |
| GET | /api/orders/:id | Ambil order by ID |
| POST | /api/orders | Buat order baru |

---

## Service B - PHP Native

### Fitur
- CRUD Sepatu dengan validasi stok
- CRUD Orders dengan transaksi DB
- JOIN query untuk detail order
- PDO dengan prepared statements

### Database Connection
```php
DB_HOST: mysql
DB_PORT: 3306
DB_USER: root
DB_PASS: root123
DB_NAME: toko_sepatu
```

---

## Testing dengan Postman

### Import Collection
1. Buka Postman
2. Import file `postman-collection.json`
3. Collection sudah dikonfigurasi untuk server `103.147.92.134`

### Test Rate Limiting
Jalankan request berikut **6 kali berturut-turut**:
```
GET http://103.147.92.134:34500/api/sepatu
```

**Expected:**
- Request 1-5: `200 OK`
- Request 6: `429 Too Many Requests`

### Contoh Request

**POST Tambah Sepatu**
```json
POST http://103.147.92.134:34500/api/sepatu
Content-Type: application/json

{
  "nama": "Air Force 1",
  "merek": "Nike",
  "ukuran": "42",
  "warna": "Putih",
  "harga": 1200000,
  "stok": 10,
  "deskripsi": "Sepatu klasik Nike Air Force 1"
}
```

**POST Buat Order**
```json
POST http://103.147.92.134:34500/api/orders
Content-Type: application/json

{
  "nama_pembeli": "John Doe",
  "email_pembeli": "john@email.com",
  "telepon": "081234567890",
  "alamat": "Jl. Contoh No.1, Jakarta Selatan",
  "sepatu_id": 3,
  "jumlah": 1,
  "catatan": "Tolong dibungkus rapi"
}
```

---

## Deploy ke Server

### Via SSH

```bash
# SSH ke server
ssh -p 8989 mahasiswa@103.147.92.134

# Clone atau pull repo
git clone https://github.com/MuhammadRizkyyy/pemrograman-service.git
# atau jika sudah ada:
cd pemrograman-service
git pull origin main

# Masuk ke folder project
cd "Pertemuan 10/tugas/sepatu-app"

# Jalankan dengan Docker
docker compose up -d --build

# Verifikasi
curl http://localhost:34500/
curl http://localhost:34501/
```

### Monitoring

```bash
# Lihat status container
docker compose ps

# Lihat logs semua service
docker compose logs -f

# Lihat logs service tertentu
docker compose logs -f service-a
docker compose logs -f service-b
docker compose logs -f mysql

# Restart service tertentu
docker compose restart service-a

# Masuk ke container
docker compose exec service-a sh
docker compose exec mysql mysql -uroot -proot123 toko_sepatu
```

---

## Development Lokal (Tanpa Docker)

### Service A
```bash
cd service-a
npm install

# Buat file .env
cat > .env << EOF
PORT=34500
SERVICE_B_URL=http://localhost:34501
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=5
EOF

npm start
```

### Service B
```bash
cd service-b

# Setup database
mysql -u root -p < setup.sql

# Jalankan PHP server
php -S localhost:34501
```

---

## Troubleshooting

### Container tidak bisa start
```bash
# Cek logs error
docker compose logs

# Cek port yang digunakan
netstat -tulpn | grep -E '34500|34501|34502|34503'

# Rebuild dari awal
docker compose down -v
docker compose up -d --build
```

### Service A tidak bisa connect ke Service B
```bash
# Cek network
docker network ls
docker network inspect sepatu-app_sepatu-network

# Cek apakah service-b sudah running
docker compose ps
```

### Database connection error
```bash
# Cek MySQL container
docker compose logs mysql

# Masuk ke MySQL container
docker compose exec mysql mysql -uroot -proot123

# Cek database
SHOW DATABASES;
USE toko_sepatu;
SHOW TABLES;
```

---

## Throttling vs Rate Limiting

| Aspek | Rate Limiting | Throttling |
|-------|--------------|------------|
| **Definisi** | Membatasi jumlah request dalam periode waktu tertentu | Mengatur kecepatan/laju pemrosesan request |
| **Respons saat batas** | Tolak request (429 Too Many Requests) | Perlambat/tunda pemrosesan request |
| **Tujuan** | Mencegah abuse & melindungi server | Menjaga kualitas layanan & stabilitas |
| **Contoh** | Maks 5 req/menit, request ke-6 ditolak | Antrian request, diproses 5/menit secara bertahap |
| **User experience** | Request langsung gagal | Request menunggu, akhirnya berhasil |
| **Implementasi** | express-rate-limit, nginx limit_req | Queue system, token bucket algorithm |

### Implementasi di Project Ini

Project ini menggunakan **Rate Limiting** dengan library `express-rate-limit`:
- Batas: 5 request per menit per IP
- Window: 60 detik (sliding window)
- Response: HTTP 429 dengan pesan error

---

## Tech Stack

- **Service A**: Node.js 18, Express, express-rate-limit, axios
- **Service B**: PHP 8.3, PDO
- **Database**: MySQL 8.0
- **Container**: Docker, Docker Compose
- **Web UI**: phpMyAdmin

---

## Struktur File

```
sepatu-app/
├── docker-compose.yml          # Orchestration semua service
├── postman-collection.json     # Collection untuk testing
├── README.md                   # Dokumentasi ini
├── server-setup.sh             # Script setup manual (legacy)
├── service-a/
│   ├── Dockerfile              # Image untuk Service A
│   ├── index.js                # Main application
│   ├── package.json            # Dependencies
│   └── .env                    # Environment variables
└── service-b/
    ├── Dockerfile              # Image untuk Service B
    ├── index.php               # Health check
    ├── setup.sql               # Database schema & seed data
    ├── config/
    │   └── db.php              # Database connection
    └── api/
        ├── sepatu.php          # CRUD Sepatu
        └── orders.php          # CRUD Orders
```

---

## Lisensi

Project untuk keperluan pembelajaran - Pertemuan 10 Pemrograman Berbasis Service
