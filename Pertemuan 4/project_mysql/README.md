# TokoBersama API

REST API backend untuk platform marketplace **TokoBersama** — menghubungkan penjual (seller) dan pembeli melalui manajemen produk, kategori, dan transaksi order.

Dibangun dengan **Node.js + Express.js** dan database **MySQL**.

---

## Teknologi

- **Runtime**: Node.js
- **Framework**: Express.js v5
- **Database**: MySQL (via `mysql2/promise`)
- **API Docs**: Scalar (`@scalar/express-api-reference`)

---

## Struktur Proyek

```
tokobersama-api/
├── routes/
│   ├── kategoriRoutes.js   # Endpoint /kategori
│   ├── sellerRoutes.js     # Endpoint /seller
│   ├── produkRoutes.js     # Endpoint /produk
│   └── orderRoutes.js      # Endpoint /order
├── db/
│   └── connection.js       # MySQL connection pool
├── app.js                  # Entry point
├── schema.sql              # DDL + data dummy
├── openapi.json            # OpenAPI 3.1.0 spec
└── package.json
```

---

## Setup & Instalasi

### 1. Clone & Install Dependensi

```bash
npm install
```

### 2. Buat Database

Import `schema.sql` ke MySQL:

```bash
mysql -u root -p < schema.sql
```

Atau buka file `schema.sql` di MySQL Workbench / phpMyAdmin dan jalankan.

### 3. Konfigurasi Koneksi Database

Edit file `db/connection.js`, sesuaikan kredensial MySQL:

```js
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password_anda", // ← sesuaikan
  database: "db_tokobersama",
});
```

### 4. Jalankan Server

```bash
npm start        # production
npm run dev      # development (nodemon)
```

Server berjalan di `http://localhost:3000`

---

## API Docs

Setelah server berjalan, buka browser ke:

**[http://localhost:3000/docs](http://localhost:3000/docs)** — Interactive API Docs (Scalar)

Raw OpenAPI spec tersedia di `/openapi.json`.

---

## Endpoint

### Kategori — `/kategori`

| Method | Path            | Deskripsi                                        |
| ------ | --------------- | ------------------------------------------------ |
| GET    | `/kategori`     | Ambil semua kategori                             |
| GET    | `/kategori/:id` | Ambil kategori by ID                             |
| POST   | `/kategori`     | Tambah kategori baru                             |
| PUT    | `/kategori/:id` | Update kategori                                  |
| DELETE | `/kategori/:id` | Hapus kategori _(dicegah jika masih ada produk)_ |

### Seller — `/seller`

| Method | Path                 | Deskripsi                       |
| ------ | -------------------- | ------------------------------- |
| GET    | `/seller`            | Ambil semua seller              |
| GET    | `/seller/:id`        | Ambil seller by ID              |
| GET    | `/seller/:id/produk` | Ambil semua produk milik seller |
| POST   | `/seller`            | Daftarkan seller baru           |
| PUT    | `/seller/:id`        | Update data seller              |
| DELETE | `/seller/:id`        | Hapus seller                    |

### Produk — `/produk`

| Method | Path                     | Deskripsi                                   |
| ------ | ------------------------ | ------------------------------------------- |
| GET    | `/produk`                | Ambil semua produk (JOIN kategori & seller) |
| GET    | `/produk/:id`            | Ambil detail produk                         |
| GET    | `/produk?kategori=1`     | Filter produk by ID kategori                |
| GET    | `/produk?search=samsung` | Cari produk by nama (LIKE)                  |
| POST   | `/produk`                | Tambah produk baru                          |
| PUT    | `/produk/:id`            | Update produk (termasuk stok)               |
| DELETE | `/produk/:id`            | Hapus produk                                |

### Order — `/order`

| Method | Path                | Deskripsi                                 |
| ------ | ------------------- | ----------------------------------------- |
| GET    | `/order`            | Ambil semua order (dengan detail produk)  |
| GET    | `/order/:id`        | Ambil detail order                        |
| POST   | `/order`            | Buat order baru _(otomatis kurangi stok)_ |
| PUT    | `/order/:id/status` | Update status order                       |
| DELETE | `/order/:id`        | Hapus order _(restore stok jika pending)_ |

### Statistik

| Method | Path         | Deskripsi                                |
| ------ | ------------ | ---------------------------------------- |
| GET    | `/statistik` | Total produk, seller, order, dan revenue |

---

## Format Response

Semua response menggunakan format JSON yang konsisten:

```json
{
  "success": true,
  "message": "Keterangan hasil operasi",
  "data": {}
}
```

---

## Fitur Utama

- **MySQL Transaction** — `POST /order` menggunakan `BEGIN / COMMIT / ROLLBACK` dengan `SELECT ... FOR UPDATE` untuk mencegah race condition pada stok
- **Restore Stok** — `DELETE /order` mengembalikan stok produk secara otomatis jika status order masih `pending`
- **Validasi Input** — Semua endpoint POST/PUT memvalidasi field wajib dan mengembalikan pesan error yang informatif
- **Query Param** — Filter dan pencarian produk via `?kategori=` dan `?search=`
- **Logging Middleware** — Setiap request dicatat dengan method, path, dan timestamp
- **Async/Await** — Semua query menggunakan `mysql2/promise` (tanpa callback)

---

## Skema Database

```
kategori ──< produk >── seller
              │
              └──< order
```

| Tabel                | Relasi                        |
| -------------------- | ----------------------------- |
| `produk.id_kategori` | → `kategori.id` (Many-to-One) |
| `produk.id_seller`   | → `seller.id` (Many-to-One)   |
| `order.id_produk`    | → `produk.id` (Many-to-One)   |
