import { Router } from 'express';
const router = Router();
import { check } from 'express-validator';
import { register, login, getMe, resetPassword } from '../../controllers/auth.controller.js';
import auth from '../../middleware/auth.middleware.js';

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters long').isLength({ min: 6 })
  ],
  register
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  login
);

// @route   GET api/auth/me
// @desc    Get authenticated user
// @access  Private
router.get('/me', auth, getMe);

// @route   PUT api/auth/reset-password
// @desc    Reset password
// @access  Private
router.put(
  '/reset-password',
  [
    auth,
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'New password must be at least 6 characters long').isLength({ min: 6 })
  ],
  resetPassword
);

export default router;