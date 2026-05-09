const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsBySeller,
  reduceStock,
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');

// Public
router.get('/', getAllProducts);
router.get('/seller/:sellerId', getProductsBySeller);
router.get('/:id', getProductById);

// Internal (called by order-service, no JWT needed but should be internal network only)
router.post('/internal/reduce-stock', reduceStock);

// Protected - seller or admin
router.post(
  '/',
  authenticate,
  authorize('seller', 'admin'),
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('category_id').optional().isInt().withMessage('Category ID must be an integer'),
  ],
  createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize('seller', 'admin'),
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  ],
  updateProduct
);

router.delete('/:id', authenticate, authorize('seller', 'admin'), deleteProduct);

module.exports = router;
