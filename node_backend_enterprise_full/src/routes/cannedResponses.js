import express from 'express';
import CannedResponse from '../models/CannedResponse.js';
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

// Role check middleware
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
};

// Get all canned responses (agents can use, admins can manage)
router.get('/:companyId/canned-responses', authenticateToken, requireRole(['admin', 'company_admin', 'department_admin', 'agent']), async (req, res) => {
    try {
        const { companyId } = req.params;
        const { category } = req.query;

        const filter = { companyId, isActive: true };
        if (category) filter.category = category;

        // Dept admin/agent see only their dept responses + company-wide
        if (req.user.role === 'department_admin' || req.user.role === 'agent') {
            filter.$or = [
                { departmentId: req.user.departmentId },
                { departmentId: null }
            ];
        }

        const responses = await CannedResponse.find(filter)
            .populate('createdBy', 'fullName')
            .sort({ category: 1, title: 1 });

        res.json({ cannedResponses: responses });
    } catch (error) {
        console.error('Get canned responses error:', error);
        res.status(500).json({ message: 'Failed to fetch canned responses' });
    }
});

// Get single canned response
router.get('/:companyId/canned-responses/:id', authenticateToken, async (req, res) => {
    try {
        const response = await CannedResponse.findById(req.params.id)
            .populate('createdBy', 'fullName');
        if (!response) {
            return res.status(404).json({ message: 'Canned response not found' });
        }
        res.json({ cannedResponse: response });
    } catch (error) {
        console.error('Get canned response error:', error);
        res.status(500).json({ message: 'Failed to fetch canned response' });
    }
});

// Create canned response (admins and dept admins only)
router.post('/:companyId/canned-responses', authenticateToken, requireRole(['admin', 'company_admin', 'department_admin']), async (req, res) => {
    try {
        const { companyId } = req.params;
        const { title, content, category, shortcut, departmentId } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const response = await CannedResponse.create({
            title: title.trim(),
            content: content.trim(),
            category: category?.trim(),
            shortcut: shortcut?.trim(),
            companyId,
            departmentId: departmentId || null,
            createdBy: req.user._id,
            isActive: true
        });

        res.status(201).json({ message: 'Canned response created', cannedResponse: response });
    } catch (error) {
        console.error('Create canned response error:', error);
        res.status(500).json({ message: 'Failed to create canned response', error: error.message });
    }
});

// Update canned response
router.put('/:companyId/canned-responses/:id', authenticateToken, requireRole(['admin', 'company_admin', 'department_admin']), async (req, res) => {
    try {
        const response = await CannedResponse.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!response) {
            return res.status(404).json({ message: 'Canned response not found' });
        }

        res.json({ message: 'Canned response updated', cannedResponse: response });
    } catch (error) {
        console.error('Update canned response error:', error);
        res.status(500).json({ message: 'Failed to update canned response', error: error.message });
    }
});

// Delete canned response
router.delete('/:companyId/canned-responses/:id', authenticateToken, requireRole(['admin', 'company_admin', 'department_admin']), async (req, res) => {
    try {
        const response = await CannedResponse.findByIdAndDelete(req.params.id);
        if (!response) {
            return res.status(404).json({ message: 'Canned response not found' });
        }
        res.json({ message: 'Canned response deleted' });
    } catch (error) {
        console.error('Delete canned response error:', error);
        res.status(500).json({ message: 'Failed to delete canned response' });
    }
});

export default router;
