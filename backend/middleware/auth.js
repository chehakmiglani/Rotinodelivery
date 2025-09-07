import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Ensure env vars are loaded even if this file is imported before server.js runs dotenv.config()
dotenv.config();

const isMockAuth = process.env.AUTH_MODE === 'mock';

export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // In mock mode, trust the token payload and skip DB lookup
    if (isMockAuth) {
      req.user = {
        _id: decoded.userId || 'mock_user',
        name: decoded.name || 'Demo User',
        email: decoded.email || 'demo@example.com',
        role: decoded.role || 'customer',
        isActive: true,
      };
      return next();
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (isMockAuth) {
        req.user = {
          _id: decoded.userId || 'mock_user',
          name: decoded.name || 'Demo User',
          email: decoded.email || 'demo@example.com',
          role: decoded.role || 'customer',
          isActive: true,
        };
      } else {
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.isActive) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};
