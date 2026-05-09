const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'marketplace_products',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const initDB = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT NOT NULL,
        category_id INT,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(15, 2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        image_url VARCHAR(500),
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // Seed default categories
    await conn.execute(`
      INSERT IGNORE INTO categories (name, description) VALUES
        ('Elektronik', 'Produk elektronik dan gadget'),
        ('Pakaian', 'Pakaian pria dan wanita'),
        ('Makanan & Minuman', 'Produk makanan dan minuman'),
        ('Rumah Tangga', 'Peralatan rumah tangga'),
        ('Olahraga', 'Perlengkapan olahraga')
    `);

    console.log('[Product-DB] Tables initialized');
  } finally {
    conn.release();
  }
};

module.exports = { pool, initDB };
