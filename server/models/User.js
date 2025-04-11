import { Schema, model } from 'mongoose';
import bcryptjs from 'bcryptjs';
const { genSalt, hash, compare } = bcryptjs;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  organization: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await genSalt(10);
    // Hash the password with the salt
    this.password = await hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Check if user is admin based on email domain
UserSchema.pre('save', function(next) {
  if (this.isNew && this.email.endsWith('@wiz.io')) {
    this.role = 'admin';
  }
  next();
});

export default model('User', UserSchema, 'users');