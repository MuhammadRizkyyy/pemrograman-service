const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  refreshToken,
  getMe,
  getAllUsers,
  deactivateUser,
  verifyToken,
} = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['buyer', 'seller']).withMessage('Role must be buyer or seller'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.post('/refresh', refreshToken);
router.get('/verify', verifyToken);

// Protected routes
router.get('/me', authenticate, getMe);

// Admin only
router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.put('/users/:id/deactivate', authenticate, authorize('admin'), deactivateUser);

module.exports = router;
