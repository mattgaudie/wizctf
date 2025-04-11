import { Router } from 'express';
const router = Router();
import { check } from 'express-validator';
import { updateProfile, uploadProfilePicture, deleteUser } from '../../controllers/user.controller.js';
import auth from '../../middleware/auth.middleware.js';
import { uploadProfile } from '../../middleware/upload.middleware.js';

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  [
    auth,
    [
      check('firstName', 'First name is required').not().isEmpty(),
      check('lastName', 'Last name is required').not().isEmpty()
    ]
  ],
  updateProfile
);

// @route   POST api/users/profile-picture
// @desc    Upload profile picture
// @access  Private
router.post(
  '/profile-picture',
  [auth, uploadProfile.single('profilePicture')],
  uploadProfilePicture
);

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private
router.delete('/:id', auth, deleteUser);

export default router;