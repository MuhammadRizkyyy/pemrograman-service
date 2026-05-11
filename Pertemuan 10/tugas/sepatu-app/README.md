# Toko Sepatu - Rate Limiting & Service Integration
## Pertemuan 10 - Pemrograman Berbasis Service

Aplikasi toko sepatu dengan 2 service yang terintegrasi:
- **Service A**: Node.js/Express Gateway dengan Rate Limiting
- **Service B**: PHP Native untuk CRUD Database

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
