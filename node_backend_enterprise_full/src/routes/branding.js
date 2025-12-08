import express from 'express';
import Branding from '../models/CompanyBranding.js';
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

// Get company branding
router.get('/:companyId/branding', authenticateToken, async (req, res) => {
  try {
    const branding = await Branding.findOne({ company: req.params.companyId })
      .populate('company', 'companyName');

    if (!branding) {
      return res.status(404).json({ message: 'Branding not found' });
    }

    res.json({ branding });
  } catch (error) {
    console.error('Get branding error:', error);
    res.status(500).json({ message: 'Failed to fetch branding' });
  }
});

// Create company branding
router.post('/:companyId/branding', authenticateToken, async (req, res) => {
  try {
    const { logoUrl, logoLinkbackUrl, faviconUrl, useDefaultBranding } = req.body;

    const branding = await Branding.create({
      company: req.params.companyId,
      logoUrl: logoUrl?.trim(),
      logoLinkbackUrl: logoLinkbackUrl?.trim(),
      faviconUrl: faviconUrl?.trim(),
      useDefaultBranding: useDefaultBranding ?? true
    });

    const populatedBranding = await Branding.findById(branding._id)
      .populate('company', 'companyName');

    res.status(201).json({
      message: 'Branding created successfully',
      branding: populatedBranding
    });
  } catch (error) {
    console.error('Create branding error:', error);
    res.status(500).json({
      message: 'Failed to create branding',
      error: error.message
    });
  }
});

// Update company branding
router.put('/:companyId/branding', authenticateToken, async (req, res) => {
  try {
    const branding = await Branding.findOneAndUpdate(
      { company: req.params.companyId },
      req.body,
      { new: true, runValidators: true, upsert: true }
    ).populate('company', 'companyName');

    res.json({
      message: 'Branding updated successfully',
      branding
    });
  } catch (error) {
    console.error('Update branding error:', error);
    res.status(500).json({ message: 'Failed to update branding', error: error.message });
  }
});

// Delete company branding
router.delete('/:companyId/branding', authenticateToken, async (req, res) => {
  try {
    const branding = await Branding.findOneAndDelete({ company: req.params.companyId });

    if (!branding) {
      return res.status(404).json({ message: 'Branding not found' });
    }

    res.json({ message: 'Branding deleted successfully' });
  } catch (error) {
    console.error('Delete branding error:', error);
    res.status(500).json({ message: 'Failed to delete branding' });
  }
});

export default router;