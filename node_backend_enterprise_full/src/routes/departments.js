import express from 'express';
import Department from '../models/Department.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { upload } from '../middleware/upload.js';
import { requireRole } from '../middleware/permissions.js';

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

// Get all departments by company ID
router.get('/:companyId/departments', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const { companyId } = req.params;

    const filter = { companyId };
    if (search) {
      filter.$or = [
        { departmentName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const departments = await Department.find(filter)
      .populate('agentIds', 'fullName email')
      .sort({ departmentName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Department.countDocuments(filter);

    res.json({
      departments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
});

// Create department
router.post('/:companyId/departments', authenticateToken, requireRole(['admin', 'company_admin']), upload.single('logo'), async (req, res) => {
  try {
    const { companyId } = req.params;
    const { departmentName, displayName, description, displayInHelpCenter, associateAgent } = req.body;

    if (!departmentName) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const logoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    let agentIds = [];
    if (associateAgent) {
      agentIds = associateAgent.split(',').map(id => id.trim()).filter(id => id);
    }

    const department = await Department.create({
      companyId,
      departmentName: departmentName.trim(),
      displayName: displayName?.trim(),
      description: description?.trim(),
      logoUrl,
      showInHelpCenter: displayInHelpCenter === 'true',
      agentIds
    });

    const populatedDepartment = await Department.findById(department._id)
      .populate('agentIds', 'fullName email');

    res.status(201).json({
      message: 'Department created successfully',
      department: populatedDepartment
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      message: 'Failed to create department',
      error: error.message
    });
  }
});

// Get single department
router.get('/:companyId/departments/:id', authenticateToken, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('agentIds', 'fullName email');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json({ department });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ message: 'Failed to fetch department' });
  }
});

// Update department
router.put('/:companyId/departments/:id', authenticateToken, requireRole(['admin', 'company_admin']), upload.single('logo'), async (req, res) => {
  try {
    const { departmentName, displayName, description, displayInHelpCenter, associateAgent } = req.body;

    let agentIds = [];
    if (associateAgent) {
      agentIds = associateAgent.split(',').map(id => id.trim()).filter(id => id);
    }

    const updateData = {
      departmentName: departmentName?.trim(),
      displayName: displayName?.trim(),
      description: description?.trim(),
      showInHelpCenter: displayInHelpCenter === 'true',
      agentIds
    };

    if (req.file) {
      updateData.logoUrl = `/uploads/${req.file.filename}`;
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('agentIds', 'fullName email');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json({
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ message: 'Failed to update department', error: error.message });
  }
});

// Delete department
router.delete('/:companyId/departments/:id', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ message: 'Failed to delete department' });
  }
});

export default router;