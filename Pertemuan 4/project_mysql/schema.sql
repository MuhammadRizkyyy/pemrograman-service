-- ============================================================
-- TokoBersama Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS db_tokobersama;
USE db_tokobersama;

-- ============================================================
-- Tabel: kategori
-- ============================================================
CREATE TABLE IF NOT EXISTS kategori (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_kategori VARCHAR(100) NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Tabel: seller
-- ============================================================
CREATE TABLE IF NOT EXISTS seller (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_toko VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  no_hp VARCHAR(20),
  alamat TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Tabel: produk
-- ============================================================
CREATE TABLE IF NOT EXISTS produk (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama VARCHAR(200) NOT NULL,
  harga DECIMAL(15,2) NOT NULL,
  stok INT NOT NULL DEFAULT 0,
  id_kategori INT NOT NULL,
  id_seller INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_produk_kategori FOREIGN KEY (id_kategori) REFERENCES kategori(id),
  CONSTRAINT fk_produk_seller FOREIGN KEY (id_seller) REFERENCES seller(id)
);

-- ============================================================
-- Tabel: order_produk (menghindari konflik keyword ORDER)
-- ============================================================
CREATE TABLE IF NOT EXISTS `order` (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_produk INT NOT NULL,
  jumlah INT NOT NULL,
  total_harga DECIMAL(15,2) NOT NULL,
  status ENUM('pending', 'proses', 'selesai', 'batal') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_produk FOREIGN KEY (id_produk) REFERENCES produk(id)
);

-- ============================================================
-- Data Dummy: kategori (5 baris)
-- ============================================================
INSERT INTO kategori (nama_kategori, deskripsi) VALUES
  ('Elektronik', 'Produk-produk elektronik seperti hp, laptop, TV, dan aksesori'),
  ('Fashion', 'Pakaian, sepatu, tas, dan aksesori fashion pria maupun wanita'),
  ('Makanan & Minuman', 'Aneka produk makanan dan minuman siap saji maupun mentah'),
  ('Perabot Rumah', 'Furnitur, peralatan dapur, dan dekorasi rumah'),
  ('Olahraga', 'Peralatan dan perlengkapan olahraga berbagai cabang');

-- ============================================================
-- Data Dummy: seller (5 baris)
-- ============================================================
INSERT INTO seller (nama_toko, email, no_hp, alamat) VALUES
  ('TechZone Official', 'techzone@mail.com', '081234567890', 'Jl. Sudirman No. 10, Jakarta'),
  ('FashionHub', 'fashionhub@mail.com', '082345678901', 'Jl. Malioboro No. 5, Yogyakarta'),
  ('WarungSehat', 'warungsehat@mail.com', '083456789012', 'Jl. Diponegoro No. 22, Bandung'),
  ('RumahModern', 'rumahmodern@mail.com', '084567890123', 'Jl. Ahmad Yani No. 8, Surabaya'),
  ('SportKing', 'sportking@mail.com', '085678901234', 'Jl. Gatot Subroto No. 15, Medan');

-- ============================================================
-- Data Dummy: produk (5 baris)
-- ============================================================
INSERT INTO produk (nama, harga, stok, id_kategori, id_seller) VALUES
  ('Samsung Galaxy A55', 4999000.00, 50, 1, 1),
  ('Kaos Polo Pria Premium', 150000.00, 200, 2, 2),
  ('Madu Hutan Murni 500ml', 85000.00, 100, 3, 3),
  ('Rak Buku Kayu Minimalis', 350000.00, 30, 4, 4),
  ('Dumbbell Set 20kg', 475000.00, 25, 5, 5);

-- ============================================================
-- Data Dummy: order (5 baris)
-- ============================================================
INSERT INTO `order` (id_produk, jumlah, total_harga, status) VALUES
  (1, 1, 4999000.00, 'selesai'),
  (2, 3, 450000.00, 'proses'),
  (3, 2, 170000.00, 'pending'),
  (4, 1, 350000.00, 'selesai'),
  (5, 2, 950000.00, 'batal');
