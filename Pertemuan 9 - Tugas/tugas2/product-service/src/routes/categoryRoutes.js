const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getAllCategories, createCategory, deleteCategory } = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getAllCategories);
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [body('name').trim().notEmpty().withMessage('Category name is required')],
  createCategory
);
router.delete('/:id', authenticate, authorize('admin'), deleteCategory);

module.exports = router;
