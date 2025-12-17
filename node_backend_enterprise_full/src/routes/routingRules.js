import express from 'express';
import RoutingRule from '../models/RoutingRule.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { hasPermission } from '../config/permissions.js';

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

// Get all routing rules
router.get('/:companyId/routing-rules', authenticateToken, requirePermission('ROUTE_CONFIG'), async (req, res) => {
    try {
        const { companyId } = req.params;
        const rules = await RoutingRule.find({ companyId, isActive: true })
            .populate('actions.assignToAgent', 'fullName email')
            .populate('actions.assignToTeam', 'teamName')
            .populate('actions.assignToDepartment', 'departmentName')
            .sort({ priority: -1 });
        res.json({ routingRules: rules });
    } catch (error) {
        console.error('Get routing rules error:', error);
        res.status(500).json({ message: 'Failed to fetch routing rules' });
    }
});

// Get single routing rule
router.get('/:companyId/routing-rules/:id', authenticateToken, requirePermission('ROUTE_CONFIG'), async (req, res) => {
    try {
        const rule = await RoutingRule.findById(req.params.id)
            .populate('actions.assignToAgent', 'fullName email')
            .populate('actions.assignToTeam', 'teamName')
            .populate('actions.assignToDepartment', 'departmentName');
        if (!rule) {
            return res.status(404).json({ message: 'Routing rule not found' });
        }
        res.json({ routingRule: rule });
    } catch (error) {
        console.error('Get routing rule error:', error);
        res.status(500).json({ message: 'Failed to fetch routing rule' });
    }
});

// Create routing rule
router.post('/:companyId/routing-rules', authenticateToken, requirePermission('ROUTE_CONFIG'), async (req, res) => {
    try {
        const { companyId } = req.params;
        const { name, description, conditions, actions, priority } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Rule name is required' });
        }

        const rule = await RoutingRule.create({
            name: name.trim(),
            description: description?.trim(),
            conditions: conditions || {},
            actions: actions || {},
            priority: priority || 0,
            companyId,
            createdBy: req.user._id,
            isActive: true
        });

        res.status(201).json({ message: 'Routing rule created', routingRule: rule });
    } catch (error) {
        console.error('Create routing rule error:', error);
        res.status(500).json({ message: 'Failed to create routing rule', error: error.message });
    }
});

// Update routing rule
router.put('/:companyId/routing-rules/:id', authenticateToken, requirePermission('ROUTE_CONFIG'), async (req, res) => {
    try {
        const rule = await RoutingRule.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!rule) {
            return res.status(404).json({ message: 'Routing rule not found' });
        }

        res.json({ message: 'Routing rule updated', routingRule: rule });
    } catch (error) {
        console.error('Update routing rule error:', error);
        res.status(500).json({ message: 'Failed to update routing rule', error: error.message });
    }
});

// Delete routing rule
router.delete('/:companyId/routing-rules/:id', authenticateToken, requirePermission('ROUTE_CONFIG'), async (req, res) => {
    try {
        const rule = await RoutingRule.findByIdAndDelete(req.params.id);
        if (!rule) {
            return res.status(404).json({ message: 'Routing rule not found' });
        }
        res.json({ message: 'Routing rule deleted' });
    } catch (error) {
        console.error('Delete routing rule error:', error);
        res.status(500).json({ message: 'Failed to delete routing rule' });
    }
});

export default router;
