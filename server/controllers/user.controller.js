import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

// Update user profile
export async function updateProfile(req, res) {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, organization, jobTitle } = req.body;

  // Build profile object
  const profileFields = {};
  if (firstName) profileFields.firstName = firstName;
  if (lastName) profileFields.lastName = lastName;
  if (organization) profileFields.organization = organization;
  if (jobTitle) profileFields.jobTitle = jobTitle;
  profileFields.updatedAt = Date.now();

  try {
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}

// Upload profile picture
export async function uploadProfilePicture(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    // Get file path
    const filePath = `/uploads/profiles/${req.file.filename}`;
    
    // Find user and update profile picture
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        profilePicture: filePath,
        updatedAt: Date.now()
      },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}

// Delete user (only for admins or self)
export async function deleteUser(req, res) {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if user has permission to delete
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ msg: 'Permission denied' });
    }
    
    // Delete profile picture if exists
    if (user.profilePicture) {
      const filePath = join(__dirname, '..', user.profilePicture);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }
    
    // Delete user
    await User.findByIdAndRemove(userId);
    
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}