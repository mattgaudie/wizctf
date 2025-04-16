import User from '../models/User.js';
import Event from '../models/Event.js';
import { validationResult } from 'express-validator';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

// Get user event participation history
export async function getUserEventHistory(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select('eventParticipation')
      .lean();

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Sort by event date (most recent first)
    const eventHistory = user.eventParticipation || [];
    eventHistory.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

    res.json(eventHistory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}

// Update user profile
export async function updateProfile(req, res) {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, organization, jobTitle, displayName } = req.body;

  try {
    // Get current user
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Build profile object
    const profileFields = {};
    if (firstName) profileFields.firstName = firstName;
    if (lastName) profileFields.lastName = lastName;
    if (organization) profileFields.organization = organization;
    if (jobTitle) profileFields.jobTitle = jobTitle;
    profileFields.updatedAt = Date.now();
    
    // Handle display name changes
    if (displayName) {
      // Check if display name is different from the current one
      if (currentUser.displayName !== displayName) {
        // Store current display name in history if it exists
        if (currentUser.displayName) {
          const update = {
            $push: { 
              displayNameHistory: {
                value: currentUser.displayName,
                changedAt: Date.now()
              }
            }
          };
          await User.findByIdAndUpdate(req.user.id, update);
        }
        
        // Set the new display name
        profileFields.displayName = displayName;
      }
    }
    
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