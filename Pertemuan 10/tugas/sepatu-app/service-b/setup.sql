CREATE DATABASE IF NOT EXISTS toko_sepatu
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE toko_sepatu;

-- ─── Tabel Sepatu ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sepatu (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nama        VARCHAR(150)   NOT NULL,
    merek       VARCHAR(100)   NOT NULL,
    ukuran      VARCHAR(20)    NOT NULL COMMENT 'Contoh: 39, 40, 41, 42',
    warna       VARCHAR(80)    NOT NULL,
    harga       DECIMAL(12,2)  NOT NULL,
    stok        INT            NOT NULL DEFAULT 0,
    deskripsi   TEXT,
    gambar_url  VARCHAR(255),
    created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Tabel Orders ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nama_pembeli    VARCHAR(150)   NOT NULL,
    email_pembeli   VARCHAR(150)   NOT NULL,
    telepon         VARCHAR(20),
    alamat          TEXT           NOT NULL,
    sepatu_id       INT            NOT NULL,
    jumlah          INT            NOT NULL DEFAULT 1,
    total_harga     DECIMAL(12,2)  NOT NULL,
    status          ENUM('pending','dibayar','dikirim','selesai','dibatalkan')
                    NOT NULL DEFAULT 'pending',
    catatan         TEXT,
    created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sepatu_id) REFERENCES sepatu(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ─── Data Sample Sepatu ──────────────────────────────────────
INSERT INTO sepatu (nama, merek, ukuran, warna, harga, stok, deskripsi) VALUES
('Air Max 270',       'Nike',    '40',  'Hitam/Putih', 1850000, 15, 'Sepatu lari dengan bantalan udara Max 270 yang nyaman'),
('Ultraboost 22',     'Adidas',  '41',  'Abu-abu',     2200000, 10, 'Sepatu lari premium dengan teknologi Boost'),
('Chuck Taylor All Star', 'Converse', '39', 'Putih',   650000,  25, 'Sepatu kanvas klasik ikonik'),
('Old Skool',         'Vans',    '42',  'Hitam/Putih', 750000,  20, 'Sepatu skateboard klasik dengan stripe samping'),
('RS-X3',             'Puma',    '40',  'Biru/Putih',  1100000, 12, 'Sepatu lifestyle dengan desain retro futuristik'),
('Gel-Kayano 29',     'Asics',   '41',  'Biru Navy',   1950000,  8, 'Sepatu lari stability dengan teknologi GEL'),
('990v5',             'New Balance', '43', 'Abu-abu',  2500000,  6, 'Sepatu premium buatan USA dengan kenyamanan maksimal'),
('Superstar',         'Adidas',  '39',  'Putih/Hitam', 900000,  18, 'Sepatu klasik dengan shell toe ikonik');

-- ─── Data Sample Orders ──────────────────────────────────────
INSERT INTO orders (nama_pembeli, email_pembeli, telepon, alamat, sepatu_id, jumlah, total_harga, status) VALUES
('Budi Santoso',  'budi@email.com',  '081234567890', 'Jl. Merdeka No.10, Jakarta',   1, 1, 1850000, 'selesai'),
('Siti Rahayu',   'siti@email.com',  '082345678901', 'Jl. Sudirman No.5, Bandung',   3, 2, 1300000, 'dikirim'),
('Ahmad Fauzi',   'ahmad@email.com', '083456789012', 'Jl. Diponegoro No.20, Surabaya', 2, 1, 2200000, 'dibayar'),
('Dewi Lestari',  'dewi@email.com',  '084567890123', 'Jl. Gatot Subroto No.8, Medan', 4, 1, 750000,  'pending');
