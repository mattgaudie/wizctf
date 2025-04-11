import jwt from 'jsonwebtoken';
import config from 'config';
const { verify } = jwt;

// Middleware to verify JWT token and add user to request
export default function(req, res, next) {
  console.log('Auth middleware - headers:', req.headers);
  
  // Get token from header
  const token = req.header('x-auth-token');
  console.log('Auth middleware - token:', token ? 'exists' : 'missing');

  // Check if no token
  if (!token) {
    console.log('Auth middleware - No token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = verify(token, config.get('jwtSecret'));
    console.log('Auth middleware - Token verified, user:', decoded.user);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Auth middleware - Invalid token:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Middleware to check if user is admin
export function isAdmin(req, res, next) {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ msg: 'Not authenticated' });
  }

  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
  }

  next();
}