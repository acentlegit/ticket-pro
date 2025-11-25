import express from 'express';
import Agent from '../models/Agent.js';
import User from '../models/User.js';
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

// Get all agents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, teamId, status, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (teamId) {
      filter.teamId = teamId;
    }
    if (status) {
      filter.status = status;
    }

    const agents = await Agent.find(filter)
      .populate('roleId', 'roleName')
      .populate('teamId', 'teamName')
      .sort({ fullName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Agent.countDocuments(filter);
    
    res.json({ 
      agents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ message: 'Failed to fetch agents' });
  }
});

// Get single agent
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id)
      .populate('roleId', 'roleName')
      .populate('teamId', 'teamName');
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    res.json({ agent });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ message: 'Failed to fetch agent' });
  }
});

export default router;