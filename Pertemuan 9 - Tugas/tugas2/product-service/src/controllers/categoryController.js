const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

// GET /categories
const getAllCategories = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM categories ORDER BY name ASC');
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('[getAllCategories]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /categories  (admin only)
const createCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { name, description } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    return res.status(201).json({
      success: true,
      message: 'Category created',
      data: { id: result.insertId, name, description },
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    }
    console.error('[createCategory]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DELETE /categories/:id  (admin only)
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    return res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('[deleteCategory]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getAllCategories, createCategory, deleteCategory };
