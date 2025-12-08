import express from 'express';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import notificationService from '../services/notificationService.js';

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
    const { companyId } = req.params;
    
    const filter = { 
      companyId,
      role: { $in: ['agent', 'supervisor', 'admin'] }
    };
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

    const agents = await User.find(filter)
      .populate('roleId', 'roleName')
      .populate('teamId', 'teamName')
      .sort({ fullName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(filter);
    
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
    const { companyId } = req.params;
    const { firstName,lastName, email, password, roleAndPermission, teamId, phone,mobile,fax,channelExpert,about, } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'Full name and email are required' });
    }

    const agentData = {
      fullName:  `${firstName} ${lastName}`,
      email: email.trim().toLowerCase(),
      role: roleAndPermission.toLowerCase() || 'agent',
      teamId: teamId || null,
      phoneNumber: phone?.trim(),
      status: 'inactive',
      companyId,
      mobile,
      channel: channelExpert,
      fax,
      about
    };

    if (password) {
      agentData.password = await bcrypt.hash(password, 12);
    }

    // Create invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 10); // 10 days expiry

    // Create invitation record
    const invitation = await Invitation.create({
      recipientEmail: email.trim().toLowerCase(),
      recipientName:  `${firstName} ${lastName}`,
      inviterName: req.user?.fullName || req.user?.name,
      inviterEmail: req.user.email,
      organizationName: 'Ticket Tracker',
      companyId,
      token: invitationToken,
      expiresAt
    });

    // Send invitation email
    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invitation/accept?token=${invitationToken}`;
    const emailData = {
      recipientName:  `${firstName} ${lastName}`,
      recipientEmail: email,
      inviterName: req.user?.fullName || req.user?.name,
      inviterEmail: req.user.email,
      organizationName: 'Ticket Tracker',
      invitationLink,
      expiryDays: 10
    };
    
    await notificationService.sendInvitationsToAgent(emailData);

    await User.create(agentData);
    
    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        email: invitation.recipientEmail,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Create agent error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ 
      message: 'Failed to send invitation', 
      error: error.message 
    });
  }
});

// Get single agent
router.get('/:companyId/agents/:id', authenticateToken, async (req, res) => {
  try {
    const agent = await User.findById(req.params.id)
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

    const agent = await User.findByIdAndUpdate(
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
    const agent = await User.findByIdAndDelete(req.params.id);
    
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