import express from 'express';
import Agent from '../models/Agent.js';
import User from '../models/User.js';
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

// Get all agents
router.get('/:companyId/agents', authenticateToken, async (req, res) => {
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

// Create agent
router.post('/:companyId/agents', authenticateToken, async (req, res) => {
  try {
    const { fullName, email, password, roleId, teamId, phoneNumber, status } = req.body;

    if (!fullName || !email || !roleId) {
      return res.status(400).json({ message: 'Full name, email, and role are required' });
    }

    const agentData = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      roleId,
      teamId: teamId || null,
      phoneNumber: phoneNumber?.trim(),
      status: status || 'active'
    };

    if (password) {
      agentData.password = await bcrypt.hash(password, 12);
    }

    const agent = await Agent.create(agentData);
    
    const populatedAgent = await Agent.findById(agent._id)
      .populate('roleId', 'roleName')
      .populate('teamId', 'teamName');
    
    res.status(201).json({
      message: 'Agent created successfully',
      agent: populatedAgent
    });
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ 
      message: 'Failed to create agent', 
      error: error.message 
    });
  }
});

// Get single agent
router.get('/:companyId/agents/:id', authenticateToken, async (req, res) => {
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

// Update agent
router.put('/:companyId/agents/:id', authenticateToken, async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('roleId', 'roleName')
      .populate('teamId', 'teamName');
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    res.json({
      message: 'Agent updated successfully',
      agent
    });
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ message: 'Failed to update agent', error: error.message });
  }
});

// Delete agent
router.delete('/:companyId/agents/:id', authenticateToken, async (req, res) => {
  try {
    const agent = await Agent.findByIdAndDelete(req.params.id);
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ message: 'Failed to delete agent' });
  }
});

export default router;