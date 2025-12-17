import express from 'express';
import Company from '../models/Company.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { upload } from '../middleware/upload.js';

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

// Get companies that a user is in (by their companyId array)
router.get('/companies/by-user/:userId', authenticateToken, async (req, res) => {
  try {
    // Get the user with their companyId array populated
    const user = await User.findById(req.params.userId).populate('companyId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // companyId is now an array, so return it directly
    const companies = user.companyId || [];
    res.json({
      companies: companies,
      count: companies.length
    });
  } catch (error) {
    console.error('Get companies by user error:', error);
    res.status(500).json({ message: 'Failed to fetch companies' });
  }
});

// Get all companies
router.get('/companies', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;

    const filter = {};
    // Restrict non-admins to their own companies (if they somehow hit this endpoint)
    if (req.user.role !== 'admin') {
      filter._id = { $in: req.user.companyId };
    }

    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { website: { $regex: search, $options: 'i' } }
      ];
    }

    const companies = await Company.find(filter)
      .populate('primaryContact', 'name email')
      .sort({ companyName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Company.countDocuments(filter);

    res.json({
      companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ message: 'Failed to fetch companies' });
  }
});

// Create company
router.post('/companies', authenticateToken, requireRole(['admin']), upload.single('logo'), async (req, res) => {
  try {
    const { companyName, description, website, employeeCount, primaryContact, address } = req.body;

    if (!companyName) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    const logoUrl = req.file ? `/uploads/tickets/${req.file.filename}` : null;

    const company = await Company.create({
      companyName: companyName.trim(),
      description: description?.trim(),
      website: website?.trim(),
      employeeCount: employeeCount || 0,
      primaryContact: primaryContact || req.user._id,
      address: address || null,
      logoUrl: logoUrl
    });

    // Add company to the creating user's companyId array (using $addToSet to prevent duplicates)
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { companyId: company._id } }
    );

    const populatedCompany = await Company.findById(company._id)
      .populate('primaryContact', 'name email');

    res.status(201).json({
      message: 'Company created successfully',
      company: populatedCompany
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      message: 'Failed to create company',
      error: error.message
    });
  }
});

// Get single company
router.get('/companies/:id', authenticateToken, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('primaryContact', 'name email');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Optional: Check if user has access to this company
    // if (req.user.role !== 'admin' && !req.user.companyId.includes(company._id)) ...

    res.json({ company });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Failed to fetch company' });
  }
});

// Update company
router.put('/companies/:id', authenticateToken, requireRole(['admin']), upload.single('logo'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.logoUrl = `/uploads/tickets/${req.file.filename}`;
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('primaryContact', 'name email');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({
      message: 'Company updated successfully',
      company
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Failed to update company', error: error.message });
  }
});

// Delete company
router.delete('/companies/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ message: 'Failed to delete company' });
  }
});

export default router;