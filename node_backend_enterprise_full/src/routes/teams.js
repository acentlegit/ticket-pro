import express from 'express';
import Team from '../models/Team.js';
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

// Get all teams
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (search) {
      filter.teamName = { $regex: search, $options: 'i' };
    }

    const teams = await Team.find(filter)
      .populate('departmentHeadId', 'fullName email')
      .sort({ teamName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Team.countDocuments(filter);
    
    res.json({ 
      teams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
});

// Create team
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { teamName, description, departmentHeadId } = req.body;

    if (!teamName) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    const team = await Team.create({
      teamName: teamName.trim(),
      description: description?.trim(),
      departmentHeadId: departmentHeadId || null
    });
    
    const populatedTeam = await Team.findById(team._id)
      .populate('departmentHeadId', 'fullName email');
    
    res.status(201).json({
      message: 'Team created successfully',
      team: populatedTeam
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ 
      message: 'Failed to create team', 
      error: error.message 
    });
  }
});

// Get single team
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('departmentHeadId', 'fullName email');
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.json({ team });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Failed to fetch team' });
  }
});

// Update team
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('departmentHeadId', 'fullName email');
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.json({
      message: 'Team updated successfully',
      team
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ message: 'Failed to update team', error: error.message });
  }
});

export default router;