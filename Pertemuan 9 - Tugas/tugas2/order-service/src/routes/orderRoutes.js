const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

// All order routes require authentication
router.use(authenticate);

router.get('/', getAllOrders);
router.get('/:id', getOrderById);

router.post(
  '/',
  authorize('buyer'),
  [
    body('items')
      .isArray({ min: 1 })
      .withMessage('Items must be a non-empty array'),
    body('items.*.product_id')
      .isInt({ min: 1 })
      .withMessage('Each item must have a valid product_id'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Each item must have a quantity >= 1'),
    body('shipping_address')
      .trim()
      .notEmpty()
      .withMessage('Shipping address is required'),
  ],
  createOrder
);

router.put(
  '/:id/status',
  authorize('admin', 'seller', 'buyer'),
  [body('status').notEmpty().withMessage('Status is required')],
  updateOrderStatus
);

router.delete('/:id', authorize('admin'), deleteOrder);

module.exports = router;
