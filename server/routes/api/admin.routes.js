import { Router } from 'express';
const router = Router();
import { check } from 'express-validator';
import { getAllUsers, getUserById, updateUser, createUser } from '../../controllers/admin.controller.js';
import auth from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/auth.middleware.js';

// All routes in this file require admin privileges
router.use(auth);
router.use(isAdmin);

// @route   GET api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', getAllUsers);

// @route   GET api/admin/users/:id
// @desc    Get user by ID
// @access  Admin
router.get('/users/:id', getUserById);

// @route   PUT api/admin/users/:id
// @desc    Update user
// @access  Admin
router.put(
  '/users/:id',
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('role', 'Role must be either user or admin').isIn(['user', 'admin'])
  ],
  updateUser
);

// @route   POST api/admin/users
// @desc    Create user
// @access  Admin
router.post(
  '/users',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('role', 'Role must be either user or admin').optional().isIn(['user', 'admin'])
  ],
  createUser
);

export default router;