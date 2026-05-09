# Backend Service - Jual-Beli Barang

Tugas Pemrograman Service - SE 2. 
Membangun backend service mandiri dengan Database, JWT, Message Broker, dan API Gateway.

## Arsitektur Sistem
Sistem ini menggunakan arsitektur microservices yang terpusat melalui satu **API Gateway**.
1.  **API Gateway (Port 3000)**: Entry point utama yang meneruskan request ke service terkait dan melakukan logging.
2.  **Auth Service (Port 3001)**: Menangani registrasi, login, dan validasi JWT.
3.  **Product Service (Port 3002)**: Menangani CRUD barang (Item).
4.  **Transaction Service (Port 3003)**: Menangani proses pembelian dan menerbitkan event ke Message Broker.
5.  **Notification Service**: Consumer asinkron yang menerima pesan dari broker saat transaksi terjadi.
6.  **Database (SQLite/Prisma)**: Penyimpanan data User, Item, dan Transaction.
7.  **Message Broker (RabbitMQ)**: Komunikasi asinkron untuk event transaksi.

## Cara Menjalankan
1.  Install dependensi:
    ```bash
    npm install
    ```
2.  Setup database (Prisma):
    ```bash
    npx prisma migrate dev --name init
    ```
3.  Jalankan seluruh service:
    ```bash
    npm start
    ```

## Daftar Endpoint (Melalui Gateway: port 3000)

### Auth Service
- `POST /auth/register`: Registrasi user baru.
  - Body: `{ "username": "...", "password": "...", "role": "ADMIN/BUYER" }`
- `POST /auth/login`: Login untuk mendapatkan token.
  - Body: `{ "username": "...", "password": "..." }`

### Product Service
- `GET /products/`: Ambil semua barang.
- `POST /products/`: Tambah barang baru (Admin only).
  - Header: `Authorization: Bearer <token>`
  - Body: `{ "name": "...", "price": 1000, "stock": 10, "description": "..." }`
- `PUT /products/:id`: Update barang (Admin only).
- `DELETE /products/:id`: Hapus barang (Admin only).

### Transaction Service
- `POST /transactions/buy`: Beli barang.
  - Header: `Authorization: Bearer <token>`
  - Body: `{ "itemId": "...", "quantity": 1 }`
- `GET /transactions/history`: Lihat riwayat pembelian user.

## Contoh Request & Response

### Register
**Request:**
```json
POST /auth/register
{
  "username": "admin123",
  "password": "password123",
  "role": "ADMIN"
}
```
**Response:**
```json
{
  "message": "User created",
  "userId": "uuid-..."
}
```

## Deployment ke Server LeAds
1.  Clone repository ke server.
2.  Update `.env` dengan konfigurasi server (Database URL, RabbitMQ URL).
3.  Jalankan menggunakan `pm2` untuk menjaga service tetap aktif:
    ```bash
    pm2 start gateway/index.js --name gateway
    pm2 start services/auth/index.js --name auth
    pm2 start services/product/index.js --name product
    pm2 start services/transaction/index.js --name transaction
    ```

Dibuat oleh: Muhammad Rizky
