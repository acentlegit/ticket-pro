
import express from 'express';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check user roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, companyId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName:name,
      email,
      password: hash,
      role: role || 'customer',
      phone,
      companyId
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      },
      companyId: user.companyId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        fullName: user?.fullName,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        companyId: user.companyId
      },
      companyId: user.companyId
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get current user endpoint
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        _id: req.user._id,
        name: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        lastLogin: req.user.lastLogin,
        companyId: req.user.companyId
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user data' });
  }
});

// Get all users (admin/supervisor only)
router.get('/users', authenticateToken, requireRole(['admin', 'supervisor']), async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Logout endpoint (optional - mainly for clearing server-side sessions if needed)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In JWT implementation, logout is mainly handled client-side
    // But we can log the logout action or invalidate refresh tokens here
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// Get invitation details
router.get('/invitation/:token', async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ 
      token: req.params.token,
      status: 'pending'
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found or expired' });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    res.json({ invitation });
  } catch (error) {
    console.error('Get invitation error:', error);
    res.status(500).json({ message: 'Failed to fetch invitation' });
  }
});

// Accept invitation and register
router.post('/invitation/accept', async (req, res) => {
  try {
    const { token, firstName, lastName, password, country, state } = req.body;

    const invitation = await Invitation.findOne({ 
      token,
      status: 'pending'
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'Invitation has expired' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: invitation.recipientEmail });
    
    if (existingUser && existingUser.status === 'active') {
      return res.status(400).json({ message: 'User already exists' });
    }

    let user;
    if (existingUser && existingUser.status === 'inactive') {
      // Update existing inactive user
      user = await User.findOneAndUpdate(
        { email: invitation.recipientEmail },
        {
          fullName: `${firstName} ${lastName}`,
          password: hashedPassword,
          status: 'active'
        },
        { new: true }
      );
    } else {
      // Create new user if doesn't exist
      user = await User.create({
        fullName: `${firstName} ${lastName}`,
        email: invitation.recipientEmail,
        password: hashedPassword,
        role: 'agent',
        companyId: invitation.companyId,
        status: 'active'
      });
    }

    // Update invitation status
    invitation.status = 'accepted';
    await invitation.save();

    res.status(201).json({
      message: 'Registration successful',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ message: 'Failed to accept invitation', error: error.message });
  }
});

// Reject invitation
router.post('/invitation/reject', async (req, res) => {
  try {
    const { token } = req.body;

    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    invitation.status = 'rejected';
    await invitation.save();

    res.json({ message: 'Invitation rejected successfully' });
  } catch (error) {
    console.error('Reject invitation error:', error);
    res.status(500).json({ message: 'Failed to reject invitation' });
  }
});

export default router;
