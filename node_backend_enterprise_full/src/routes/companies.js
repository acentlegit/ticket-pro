import express from 'express';
import Company from '../models/Company.js';
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

// Get company by primary user ID
router.get('/companies/by-user/:userId', authenticateToken, async (req, res) => {
  try {
    const company = await Company.findOne({ primaryContact: req.params.userId })
      .populate('primaryContact', 'name email');

    if (!company) {
      return res.status(404).json({ message: 'Company not found for this user' });
    }

    res.json({ company });
  } catch (error) {
    console.error('Get company by user error:', error);
    res.status(500).json({ message: 'Failed to fetch company' });
  }
});

// Get all companies
router.get('/companies', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;

    const filter = {};
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
router.post('/companies', authenticateToken, async (req, res) => {
  try {
    const { companyName, description, website, employeeCount, primaryContact, address, logoUrl } = req.body;

    if (!companyName) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    const company = await Company.create({
      companyName: companyName.trim(),
      description: description?.trim(),
      website: website?.trim(),
      employeeCount: employeeCount || 0,
      primaryContact: primaryContact || req.user._id,
      address: address || null,
      logoUrl: logoUrl?.trim()
    });

    // Associate company with the creating user
    await User.findByIdAndUpdate(req.user._id, { companyId: company._id });

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

    res.json({ company });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Failed to fetch company' });
  }
});

// Update company
router.put('/companies/:id', authenticateToken, async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
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
router.delete('/companies/:id', authenticateToken, async (req, res) => {
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