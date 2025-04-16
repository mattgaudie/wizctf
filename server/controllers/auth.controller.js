import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import config from 'config';
const { sign } = jwt;
import { validationResult } from 'express-validator';

// Register a new user
export async function register(req, res) {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, firstName, lastName, organization, jobTitle, displayName } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    
    // Generate default display name if not provided
    const userDisplayName = displayName || 
      (firstName && lastName ? `${firstName} ${lastName}` : email.split('@')[0]);

    // Create new user
    user = new User({
      email,
      password,
      firstName,
      lastName,
      displayName: userDisplayName,
      organization,
      jobTitle
    });

    // Save user to database
    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    sign(
      payload,
      config.get('jwtSecret'),
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}

// Login user
export async function login(req, res) {
  console.log('Login attempt:', req.body);
  
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch ? 'Yes' : 'No');
    
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    // Add displayName if it doesn't exist
    if (!user.displayName) {
      // Generate a display name
      const displayName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.email.split('@')[0];
      
      user.displayName = displayName;
      await user.save();
      console.log('Added displayName to user:', displayName);
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    sign(
      payload,
      config.get('jwtSecret'),
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        console.log('Token generated:', token ? 'Yes' : 'No');
        
        const response = { 
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            role: user.role
          }
        };
        
        console.log('Sending response:', response);
        res.json(response);
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}

// Get authenticated user
export async function getMe(req, res) {
  try {
    console.log('GetMe called for user ID:', req.user.id);
    let user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      console.log('User not found in getMe');
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Handle case for existing users without displayName
    if (!user.displayName) {
      console.log('User has no displayName, generating one');
      // Generate display name from existing fields
      const displayName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.email.split('@')[0];
      
      try {
        user.displayName = displayName;
        await user.save();
        console.log('Added displayName to user in getMe:', displayName);
      } catch (saveErr) {
        console.error('Error saving displayName in getMe:', saveErr);
        // Continue anyway - we can still return the user object
      }
    }
    
    console.log('Returning user data:', {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      role: user.role
    });
    
    res.json(user);
  } catch (err) {
    console.error('Error in getMe:', err.message);
    res.status(500).send('Server error');
  }
}

// Reset password
export async function resetPassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}