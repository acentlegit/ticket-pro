import express from 'express';
import SlaRule from '../models/SlaRule.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { hasPermission, ROLES } from '../config/permissions.js';

const router = express.Router();

// Auth middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Access token required' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: 'Invalid token' });

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Permission check middleware
const requirePermission = (permissionId) => {
    return (req, res, next) => {
        if (!hasPermission(req.user.role, permissionId)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
};

// Get all SLA rules
router.get('/:companyId/sla-rules', authenticateToken, async (req, res) => {
    try {
        const slaRules = await SlaRule.find({ isActive: true }).sort({ priority: 1 });
        res.json({ slaRules });
    } catch (error) {
        console.error('Get SLA rules error:', error);
        res.status(500).json({ message: 'Failed to fetch SLA rules' });
    }
});

// Get single SLA rule
router.get('/:companyId/sla-rules/:id', authenticateToken, async (req, res) => {
    try {
        const slaRule = await SlaRule.findById(req.params.id);
        if (!slaRule) {
            return res.status(404).json({ message: 'SLA rule not found' });
        }
        res.json({ slaRule });
    } catch (error) {
        console.error('Get SLA rule error:', error);
        res.status(500).json({ message: 'Failed to fetch SLA rule' });
    }
});

// Create SLA rule
router.post('/:companyId/sla-rules', authenticateToken, requirePermission('SLA_CONFIG'), async (req, res) => {
    try {
        const { name, firstResponseTimeMinutes, resolutionTimeMinutes, priority, conditions, isActive } = req.body;

        if (!name || !firstResponseTimeMinutes || !resolutionTimeMinutes) {
            return res.status(400).json({ message: 'Name, first response time, and resolution time are required' });
        }

        const slaRule = await SlaRule.create({
            name: name.trim(),
            firstResponseTimeMinutes,
            resolutionTimeMinutes,
            priority: priority || 'medium',
            conditions: conditions || {},
            isActive: isActive !== false
        });

        res.status(201).json({ message: 'SLA rule created', slaRule });
    } catch (error) {
        console.error('Create SLA rule error:', error);
        res.status(500).json({ message: 'Failed to create SLA rule', error: error.message });
    }
});

// Update SLA rule
router.put('/:companyId/sla-rules/:id', authenticateToken, requirePermission('SLA_CONFIG'), async (req, res) => {
    try {
        const slaRule = await SlaRule.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!slaRule) {
            return res.status(404).json({ message: 'SLA rule not found' });
        }

        res.json({ message: 'SLA rule updated', slaRule });
    } catch (error) {
        console.error('Update SLA rule error:', error);
        res.status(500).json({ message: 'Failed to update SLA rule', error: error.message });
    }
});

// Delete SLA rule
router.delete('/:companyId/sla-rules/:id', authenticateToken, requirePermission('SLA_CONFIG'), async (req, res) => {
    try {
        const slaRule = await SlaRule.findByIdAndDelete(req.params.id);
        if (!slaRule) {
            return res.status(404).json({ message: 'SLA rule not found' });
        }
        res.json({ message: 'SLA rule deleted' });
    } catch (error) {
        console.error('Delete SLA rule error:', error);
        res.status(500).json({ message: 'Failed to delete SLA rule' });
    }
});

export default router;
