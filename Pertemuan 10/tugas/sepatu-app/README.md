# Toko Sepatu - Rate Limiting & Service Integration
## Pertemuan 10 - Pemrograman Berbasis Layanan

---

## Arsitektur

```
[Client/Postman]
      │
      ▼
[Service A - Node.js/Express :3000]
  • Rate Limiting: maks 5 req/menit
  • Proxy/Gateway ke Service B
      │
      ▼ HTTP REST
[Service B - PHP Native :8080]
  • CRUD Sepatu
  • CRUD Orders
      │
      ▼
[MySQL Database: toko_sepatu]
```

---

## Service A - Node.js/Express (Port 3000)

### Fitur
- Rate Limiting: **maksimal 5 request per menit** per IP
- Proxy semua request ke Service B
- Response 429 jika melebihi batas

### Instalasi & Jalankan Lokal
```bash
cd service-a
npm install
npm start
```

### Endpoints (via Service A)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/sepatu | Ambil semua sepatu |
| GET | /api/sepatu/:id | Ambil sepatu by ID |
| POST | /api/sepatu | Tambah sepatu baru |
| PUT | /api/sepatu/:id | Update sepatu |
| DELETE | /api/sepatu/:id | Hapus sepatu |
| GET | /api/orders | Ambil semua orders |
| GET | /api/orders/:id | Ambil order by ID |
| POST | /api/orders | Buat order baru |

---

## Service B - PHP Native (Port 8080)

### Fitur
- CRUD Sepatu dengan validasi stok
- CRUD Orders dengan transaksi DB
- JOIN query untuk detail order

### Jalankan Lokal
```bash
cd service-b
# Setup database dulu
mysql -u root < setup.sql
# Jalankan PHP built-in server
php -S localhost:8080
```

---

## Setup Database

```bash
mysql -u root -p < service-b/setup.sql
```

---

## Uji Lokal dengan Postman

### 1. Test Normal (200 OK)
```
GET http://localhost:3000/api/sepatu
```

### 2. Test Rate Limit (429 Too Many Requests)
Kirim request ke endpoint yang sama **lebih dari 5 kali dalam 1 menit**:
```
GET http://localhost:3000/api/sepatu  (request ke-6 akan 429)
```

### 3. Contoh POST Sepatu
```json
POST http://localhost:3000/api/sepatu
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

### 4. Contoh POST Order
```json
POST http://localhost:3000/api/orders
Content-Type: application/json

{
  "nama_pembeli": "John Doe",
  "email_pembeli": "john@email.com",
  "telepon": "081234567890",
  "alamat": "Jl. Contoh No.1, Jakarta",
  "sepatu_id": 1,
  "jumlah": 1
}
```

---

## Deploy ke Server

```bash
# Dari direktori sepatu-app/
chmod +x deploy.sh
./deploy.sh
```

Atau manual:
```bash
# Upload file
scp -P 8989 -r service-a mahasiswa@103.147.92.134:/home/mahasiswa/sepatu-app/
scp -P 8989 -r service-b mahasiswa@103.147.92.134:/home/mahasiswa/sepatu-app/

# SSH ke server
ssh -p 8989 mahasiswa@103.147.92.134

# Di server: jalankan Service A
cd /home/mahasiswa/sepatu-app/service-a
npm install && pm2 start index.js --name service-a

# Di server: setup DB dan jalankan Service B
mysql -u root < /home/mahasiswa/sepatu-app/service-b/setup.sql
php -S 0.0.0.0:8080 -t /home/mahasiswa/sepatu-app/service-b &
```

### URL Setelah Deploy
- Service A: `http://103.147.92.134:3000`
- Service B: `http://103.147.92.134:8080`

---

## Throttling vs Rate Limiting

| Aspek | Rate Limiting | Throttling |
|-------|--------------|------------|
| **Definisi** | Membatasi jumlah request dalam periode waktu tertentu | Mengatur kecepatan/laju pemrosesan request |
| **Respons saat batas** | Tolak request (429 Too Many Requests) | Perlambat/tunda pemrosesan request |
| **Tujuan** | Mencegah abuse & melindungi server | Menjaga kualitas layanan & stabilitas |
| **Contoh** | Maks 5 req/menit → request ke-6 ditolak | Antrian request, diproses 5/menit secara bertahap |
| **User experience** | Request langsung gagal | Request menunggu, akhirnya berhasil |
| **Implementasi** | express-rate-limit, nginx limit_req | Queue system, token bucket algorithm |
