import express from 'express';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { generateToken, setTokenCookie, clearTokenCookie } from '../utils/jwt.js';
import { validateRequest } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { registerSchema, loginSchema, updateProfileSchema, addAddressSchema } from '../schemas/authSchemas.js';

dotenv.config();
const router = express.Router();
const isMockAuth = process.env.AUTH_MODE === 'mock';

// Register
router.post('/register', validateRequest(registerSchema), async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Mock mode: accept any registration and return a token without DB
    if (isMockAuth) {
      const token = generateToken('mock_user', { name, email, role: role || 'customer' });
      setTokenCookie(res, token);
      return res.status(201).json({
        success: true,
        message: 'User registered successfully (mock)',
        user: { _id: 'mock_user', name, email, phone, role: role || 'customer' }
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      phone,
      role
    });

    await user.save();

    // Generate token and set cookie
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error.message
    });
  }
});

// Login
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Mock mode: allow known demo accounts and a generic demo
    if (isMockAuth) {
      const demoUsers = [
        { email: 'john@example.com', password: 'Password123', name: 'John Doe', role: 'customer' },
        { email: 'owner@pizzapalace.com', password: 'Password123', name: 'Pizza Owner', role: 'restaurant_owner' },
        { email: 'owner@burgerhub.com', password: 'Password123', name: 'Burger Owner', role: 'restaurant_owner' },
      ];
      const match = demoUsers.find(u => u.email === email && u.password === password);
      const userPayload = match || { name: 'Demo User', email, role: 'customer' };
      const token = generateToken('mock_user', userPayload);
      setTokenCookie(res, token);
      return res.json({
        success: true,
        message: 'Login successful (mock)',
        user: { _id: 'mock_user', name: userPayload.name, email: userPayload.email, role: userPayload.role }
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token and set cookie
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
});

// Mock login helper (only in mock mode) to force-set cookie when frontend having issues
router.get('/mock-login', (req, res) => {
  if (!isMockAuth) {
    return res.status(400).json({ success: false, message: 'Not available outside mock mode' });
  }
  const token = generateToken('mock_user', { name: 'Demo User', email: 'demo@example.com', role: 'customer' });
  setTokenCookie(res, token);
  res.json({ success: true, message: 'Mock login cookie set', user: { _id: 'mock_user', name: 'Demo User', email: 'demo@example.com', role: 'customer' } });
});

// Debug cookie endpoint to inspect request cookies (mock mode only)
router.get('/debug-cookie', (req, res) => {
  if (!isMockAuth) {
    return res.status(400).json({ success: false, message: 'Not available outside mock mode' });
  }
  res.json({ success: true, cookies: req.cookies, receivedToken: !!req.cookies.token });
});

// Logout
router.post('/logout', (req, res) => {
  clearTokenCookie(res);
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (isMockAuth) {
      return res.json({ success: true, user: req.user });
    }

    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
});

// Update profile
router.put('/profile', authenticateToken, validateRequest(updateProfileSchema), async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, select: '-password' }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Add address
router.post('/addresses', authenticateToken, validateRequest(addAddressSchema), async (req, res) => {
  try {
    const addressData = req.body;

    const user = await User.findById(req.user._id);

    // If this is set as default, unset other defaults
    if (addressData.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // If this is the first address, make it default
    if (user.addresses.length === 0) {
      addressData.isDefault = true;
    }

    user.addresses.push(addressData);
    await user.save();

    const updatedUser = await User.findById(req.user._id).select('-password');

    res.json({
      success: true,
      message: 'Address added successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add address',
      error: error.message
    });
  }
});

// Update address
router.put('/addresses/:addressId', authenticateToken, validateRequest(addAddressSchema), async (req, res) => {
  try {
    const { addressId } = req.params;
    const addressData = req.body;

    const user = await User.findById(req.user._id);
    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If this is set as default, unset other defaults
    if (addressData.isDefault) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    // Update address
    Object.assign(address, addressData);
    await user.save();

    const updatedUser = await User.findById(req.user._id).select('-password');

    res.json({
      success: true,
      message: 'Address updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message
    });
  }
});

// Delete address
router.delete('/addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    // If deleted address was default, make first remaining address default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    const updatedUser = await User.findById(req.user._id).select('-password');

    res.json({
      success: true,
      message: 'Address deleted successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: error.message
    });
  }
});

export default router;
