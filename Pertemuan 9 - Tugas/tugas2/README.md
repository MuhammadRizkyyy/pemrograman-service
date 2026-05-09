# Marketplace Backend Service

Sistem backend untuk platform jual beli barang berbasis microservices.

**Mahasiswa:** Muhammad Rizky — 2410511049  
**Server:** `103.147.92.134` (LeAds) — port SSH: `8989`

## Arsitektur Sistem

```
Client
  │
  ▼
┌─────────────────────────────────────────┐
│         API Gateway (:34900)            │
│  - Routing ke semua service             │
│  - Rate Limiting (100 req/15 menit)     │
│  - Request Logging & Request ID         │
└────┬──────────┬──────────┬──────────────┘
     │          │          │          │
     ▼          ▼          ▼          ▼
┌──────────┐ ┌─────────┐ ┌────────┐ ┌──────────────┐
│  Auth    │ │Product  │ │ Order  │ │Notification  │
│ Service  │ │Service  │ │Service │ │   Service    │
│ (:34901) │ │(:34902) │ │(:34903)│ │   (:34904)   │
└────┬─────┘ └────┬────┘ └───┬────┘ └──────┬───────┘
     │             │          │              │
     └─────────────┴────┬─────┘              │
                        │                    │
               ┌────────▼──────┐             │
               │     MySQL     │             │
               │  (:34905)     │             │
               │   (4 DBs)     │             │
               └───────────────┘             │
                                             │
               ┌─────────────────────────────┘
               │
        ┌──────▼──────┐
        │  RabbitMQ   │
        │  (:34906)   │
        │  UI(:34907) │
        │  Publisher  │
        │  Consumer   │
        └─────────────┘
```

## Komponen Utama

| Komponen | Service | Port (Host) | Port (Internal) | Deskripsi |
|---|---|---|---|---|
| API Gateway | api-gateway | **34900** | 3000 | Entry point, routing, rate limiting |
| Auth Service | auth-service | **34901** | 3001 | Register, login, JWT, role management |
| Product Service | product-service | **34902** | 3002 | CRUD produk & kategori |
| Order Service | order-service | **34903** | 3003 | CRUD pesanan + publish RabbitMQ |
| Notification Service | notification-service | **34904** | 3004 | Consumer RabbitMQ, simpan notifikasi |
| MySQL | - | **34905** | 3306 | Database utama (4 database terpisah) |
| RabbitMQ | - | **34906** | 5672 | Message broker |
| RabbitMQ UI | - | **34907** | 15672 | Management dashboard |

> Port menggunakan range **349xx** berdasarkan NIM 2410511049 agar tidak konflik dengan mahasiswa lain di server shared LeAds.

## Role Pengguna

| Role | Akses |
|---|---|
| `buyer` | Register, login, lihat produk, buat pesanan, lihat pesanan sendiri, notifikasi |
| `seller` | Semua buyer + CRUD produk milik sendiri, update status pesanan |
| `admin` | Akses penuh ke semua endpoint |

---

## Cara Menjalankan

### Prasyarat
- Docker & docker-compose

### 1. Clone & Setup Environment

```bash
git clone https://github.com/MuhammadRizkyyy/pemrograman-service.git
cd "pemrograman-service/Pertemuan 9 - Tugas/tugas2"
cp .env.example .env
```

### 2. Jalankan dengan Docker Compose

```bash
# Build dan jalankan semua service
docker-compose up -d --build

# Cek status semua container
docker-compose ps

# Lihat log semua service
docker-compose logs -f

# Lihat log service tertentu
docker-compose logs -f rizky_gateway
```

### 3. Verifikasi Service Berjalan

```bash
curl http://localhost:34900/health
```

---

## Daftar Endpoint

Semua request melalui API Gateway:
- **Lokal:** `http://localhost:34900`
- **Server LeAds:** `http://103.147.92.134:34900`

### Auth Service `/api/auth`

#### POST /api/auth/register
Registrasi pengguna baru.

**Request:**
```json
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "password": "password123",
  "role": "buyer"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": 1, "name": "Budi Santoso", "email": "budi@example.com", "role": "buyer" },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/login
Login dan dapatkan token.

**Request:**
```json
{
  "email": "budi@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": 1, "name": "Budi Santoso", "email": "budi@example.com", "role": "buyer" },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/refresh
Refresh access token.

**Request:**
```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

#### GET /api/auth/me 🔒
Lihat profil sendiri. Membutuhkan `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": { "id": 1, "name": "Budi Santoso", "email": "budi@example.com", "role": "buyer", "created_at": "..." }
}
```

#### GET /api/auth/users 🔒 (admin)
Lihat semua pengguna.

#### PUT /api/auth/users/:id/deactivate 🔒 (admin)
Nonaktifkan pengguna.

---

### Product Service `/api/products`

#### GET /api/products
Lihat semua produk (publik). Query params: `page`, `limit`, `category_id`, `search`, `min_price`, `max_price`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "seller_id": 2,
      "name": "Laptop Gaming ASUS",
      "description": "Laptop gaming terbaru",
      "price": "15000000.00",
      "stock": 10,
      "category_id": 1,
      "category_name": "Elektronik"
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
}
```

#### GET /api/products/:id
Detail produk.

#### POST /api/products 🔒 (seller, admin)
Tambah produk baru.

**Request:**
```json
{
  "name": "Laptop Gaming ASUS",
  "description": "Laptop gaming terbaru dengan RTX 4060",
  "price": 15000000,
  "stock": 10,
  "category_id": 1,
  "image_url": "https://example.com/laptop.jpg"
}
```

#### PUT /api/products/:id 🔒 (seller owner, admin)
Update produk.

#### DELETE /api/products/:id 🔒 (seller owner, admin)
Hapus produk (soft delete).

#### GET /api/products/seller/:sellerId
Produk milik seller tertentu.

---

### Category Service `/api/categories`

#### GET /api/categories
Lihat semua kategori (publik).

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Elektronik", "description": "Produk elektronik dan gadget" },
    { "id": 2, "name": "Pakaian", "description": "Pakaian pria dan wanita" }
  ]
}
```

#### POST /api/categories 🔒 (admin)
Tambah kategori baru.

**Request:**
```json
{ "name": "Otomotif", "description": "Produk otomotif" }
```

#### DELETE /api/categories/:id 🔒 (admin)
Hapus kategori.

---

### Order Service `/api/orders`

#### POST /api/orders 🔒 (buyer)
Buat pesanan baru. Otomatis mengurangi stok dan mengirim event ke RabbitMQ.

**Request:**
```json
{
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ],
  "shipping_address": "Jl. Merdeka No. 10, Jakarta Pusat",
  "notes": "Tolong dibungkus rapi"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 1,
    "buyer_id": 1,
    "status": "pending",
    "total_amount": "30000000.00",
    "shipping_address": "Jl. Merdeka No. 10, Jakarta Pusat",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "Laptop Gaming ASUS",
        "quantity": 2,
        "unit_price": "15000000.00",
        "subtotal": "30000000.00"
      }
    ]
  }
}
```

#### GET /api/orders 🔒
Lihat daftar pesanan. Buyer hanya melihat pesanan sendiri, admin melihat semua.
Query params: `page`, `limit`, `status`

#### GET /api/orders/:id 🔒
Detail pesanan.

#### PUT /api/orders/:id/status 🔒
Update status pesanan.
- Buyer: hanya bisa `cancelled` untuk pesanan `pending` milik sendiri
- Seller/Admin: bisa `confirmed`, `shipped`, `delivered`, `cancelled`

**Request:**
```json
{ "status": "confirmed" }
```

#### DELETE /api/orders/:id 🔒 (admin)
Hapus pesanan.

---

### Notification Service `/api/notifications`

#### GET /api/notifications 🔒
Lihat notifikasi milik sendiri.
Query params: `page`, `limit`, `is_read` (true/false)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "type": "ORDER_CREATED",
      "title": "Pesanan Berhasil Dibuat",
      "message": "Pesanan #1 senilai Rp 30.000.000 telah berhasil dibuat.",
      "is_read": 0,
      "created_at": "2024-01-01T10:00:00.000Z"
    }
  ]
}
```

#### GET /api/notifications/unread-count 🔒
Jumlah notifikasi belum dibaca.

#### PUT /api/notifications/:id/read 🔒
Tandai notifikasi sebagai sudah dibaca.

#### PUT /api/notifications/read-all 🔒
Tandai semua notifikasi sebagai sudah dibaca.

---

## Alur Message Broker (RabbitMQ)

```
Order Service                    RabbitMQ                  Notification Service
     │                               │                              │
     │  POST /orders (buyer)         │                              │
     │──────────────────────────────►│                              │
     │                               │                              │
     │  publish: order.created       │                              │
     │──────────────────────────────►│                              │
     │                               │  consume: order.created      │
     │                               │─────────────────────────────►│
     │                               │                              │
     │                               │  Simpan notifikasi ke DB     │
     │                               │                              │
     │  PUT /orders/:id/status       │                              │
     │──────────────────────────────►│                              │
     │                               │                              │
     │  publish: order.status.xxx    │                              │
     │──────────────────────────────►│                              │
     │                               │  consume: order.status.*     │
     │                               │─────────────────────────────►│
     │                               │                              │
     │                               │  Simpan notifikasi status    │
```

---

## Contoh Alur Penggunaan Lengkap

```bash
BASE_URL="http://103.147.92.134:34900"

# 1. Register sebagai seller
curl -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Toko Andi","email":"andi@seller.com","password":"pass123","role":"seller"}'

# 2. Login sebagai seller
TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"andi@seller.com","password":"pass123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# 3. Tambah produk
curl -X POST $BASE_URL/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sepatu Nike","price":500000,"stock":50,"category_id":5}'

# 4. Register sebagai buyer
curl -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Budi Buyer","email":"budi@buyer.com","password":"pass123","role":"buyer"}'

# 5. Login sebagai buyer
BUYER_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"budi@buyer.com","password":"pass123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# 6. Buat pesanan
curl -X POST $BASE_URL/api/orders \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"product_id":1,"quantity":2}],"shipping_address":"Jl. Merdeka No.1 Jakarta"}'

# 7. Cek notifikasi (otomatis dibuat oleh notification-service via RabbitMQ)
curl $BASE_URL/api/notifications \
  -H "Authorization: Bearer $BUYER_TOKEN"
```

---

## Struktur Folder

```
.
├── api-gateway/
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT validation
│   │   │   ├── logger.js        # Morgan + Request ID
│   │   │   └── rateLimiter.js   # Rate limiting
│   │   └── index.js             # Proxy routing
│   ├── Dockerfile
│   └── package.json
│
├── auth-service/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/authController.js
│   │   ├── middleware/auth.js
│   │   ├── routes/authRoutes.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
│
├── product-service/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/
│   │   │   ├── productController.js
│   │   │   └── categoryController.js
│   │   ├── middleware/auth.js
│   │   ├── routes/
│   │   │   ├── productRoutes.js
│   │   │   └── categoryRoutes.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
│
├── order-service/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── rabbitmq.js      # Publisher
│   │   ├── controllers/orderController.js
│   │   ├── middleware/auth.js
│   │   ├── routes/orderRoutes.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
│
├── notification-service/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── consumers/orderConsumer.js  # RabbitMQ Consumer
│   │   ├── routes/notificationRoutes.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
│
├── database/
│   └── init.sql                 # Inisialisasi semua database
│
├── postman/
│   └── Marketplace_API.postman_collection.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Akun Default

Setelah inisialisasi database, tersedia akun admin:
- **Email:** admin@marketplace.com
- **Password:** admin123

---

## RabbitMQ Management UI

Akses di: `http://103.147.92.134:34907`
- Username: `guest`
- Password: `guest`
