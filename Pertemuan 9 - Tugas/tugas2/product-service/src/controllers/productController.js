const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

// Helper: parse pagination params safely
const parsePagination = (page, limit) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, parseInt(limit, 10) || 10);
  return { pageNum: p, limitNum: l, offset: (p - 1) * l };
};

// GET /products  - public, with pagination & filter
const getAllProducts = async (req, res) => {
  const { page = 1, limit = 10, category_id, search, min_price, max_price } = req.query;
  const { pageNum, limitNum, offset } = parsePagination(page, limit);

  let whereClause = 'WHERE p.is_active = 1';
  const params = [];

  if (category_id) {
    whereClause += ' AND p.category_id = ?';
    params.push(parseInt(category_id, 10));
  }
  if (search) {
    whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (min_price) {
    whereClause += ' AND p.price >= ?';
    params.push(parseFloat(min_price));
  }
  if (max_price) {
    whereClause += ' AND p.price <= ?';
    params.push(parseFloat(max_price));
  }

  try {
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT p.id, p.seller_id, p.name, p.description, p.price, p.stock,
              p.image_url, p.created_at, c.id as category_id, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      params
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[getAllProducts]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /products/:id
const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT p.id, p.seller_id, p.name, p.description, p.price, p.stock,
              p.image_url, p.is_active, p.created_at, p.updated_at,
              c.id as category_id, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[getProductById]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /products  (seller/admin only)
const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { name, description, price, stock, category_id, image_url } = req.body;
  const seller_id = req.user.id;

  try {
    if (category_id) {
      const [cat] = await pool.execute('SELECT id FROM categories WHERE id = ?', [category_id]);
      if (cat.length === 0) {
        return res.status(400).json({ success: false, message: 'Category not found' });
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO products (seller_id, category_id, name, description, price, stock, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [seller_id, category_id || null, name, description || null, price, stock || 0, image_url || null]
    );

    const [newProduct] = await pool.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct[0],
    });
  } catch (err) {
    console.error('[createProduct]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PUT /products/:id  (seller owner / admin)
const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description, price, stock, category_id, image_url, is_active } = req.body;

  try {
    const [existing] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = existing[0];

    if (req.user.role !== 'admin' && product.seller_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: not your product' });
    }

    const updatedName   = name        ?? product.name;
    const updatedDesc   = description ?? product.description;
    const updatedPrice  = price       ?? product.price;
    const updatedStock  = stock       ?? product.stock;
    const updatedCat    = category_id !== undefined ? category_id : product.category_id;
    const updatedImg    = image_url   ?? product.image_url;
    const updatedActive = is_active   !== undefined ? is_active   : product.is_active;

    await pool.execute(
      `UPDATE products SET name=?, description=?, price=?, stock=?, category_id=?, image_url=?, is_active=?
       WHERE id=?`,
      [updatedName, updatedDesc, updatedPrice, updatedStock, updatedCat, updatedImg, updatedActive, id]
    );

    const [updated] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Product updated', data: updated[0] });
  } catch (err) {
    console.error('[updateProduct]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DELETE /products/:id  (seller owner / admin)
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = existing[0];
    if (req.user.role !== 'admin' && product.seller_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: not your product' });
    }

    await pool.execute('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Product deleted (deactivated)' });
  } catch (err) {
    console.error('[deleteProduct]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /products/seller/:sellerId
const getProductsBySeller = async (req, res) => {
  const { sellerId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { pageNum, limitNum, offset } = parsePagination(page, limit);

  try {
    const [countRows] = await pool.execute(
      'SELECT COUNT(*) as total FROM products WHERE seller_id = ? AND is_active = 1',
      [parseInt(sellerId, 10)]
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.seller_id = ? AND p.is_active = 1
       ORDER BY p.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`,
      [parseInt(sellerId, 10)]
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('[getProductsBySeller]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Internal: reduce stock
const reduceStock = async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Items array required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const item of items) {
      const [rows] = await conn.execute(
        'SELECT stock FROM products WHERE id = ? AND is_active = 1 FOR UPDATE',
        [item.product_id]
      );
      if (rows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: `Product ${item.product_id} not found` });
      }
      if (rows[0].stock < item.quantity) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${item.product_id}`,
        });
      }
      await conn.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await conn.commit();
    return res.status(200).json({ success: true, message: 'Stock reduced successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('[reduceStock]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    conn.release();
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsBySeller,
  reduceStock,
};
