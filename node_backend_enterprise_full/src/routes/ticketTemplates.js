import express from 'express';
import TicketTemplate from '../models/TicketTemplate.js';
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

// Get all ticket templates (anyone can read for ticket creation)
router.get('/:companyId/ticket-templates', authenticateToken, async (req, res) => {
    try {
        const { companyId } = req.params;
        const templates = await TicketTemplate.find({ companyId, isActive: true })
            .populate('departmentId', 'departmentName')
            .populate('createdBy', 'fullName')
            .sort({ name: 1 });
        res.json({ ticketTemplates: templates });
    } catch (error) {
        console.error('Get ticket templates error:', error);
        res.status(500).json({ message: 'Failed to fetch ticket templates' });
    }
});

// Get single ticket template
router.get('/:companyId/ticket-templates/:id', authenticateToken, async (req, res) => {
    try {
        const template = await TicketTemplate.findById(req.params.id)
            .populate('departmentId', 'departmentName')
            .populate('createdBy', 'fullName');
        if (!template) {
            return res.status(404).json({ message: 'Ticket template not found' });
        }
        res.json({ ticketTemplate: template });
    } catch (error) {
        console.error('Get ticket template error:', error);
        res.status(500).json({ message: 'Failed to fetch ticket template' });
    }
});

// Create ticket template
router.post('/:companyId/ticket-templates', authenticateToken, requirePermission('TEMPLATE_MANAGE'), async (req, res) => {
    try {
        const { companyId } = req.params;
        const { name, subject, description, priority, category, departmentId } = req.body;

        if (!name || !subject) {
            return res.status(400).json({ message: 'Name and subject are required' });
        }

        const template = await TicketTemplate.create({
            name: name.trim(),
            subject: subject.trim(),
            description: description?.trim(),
            priority: priority || 'medium',
            category: category?.trim(),
            departmentId: departmentId || null,
            companyId,
            createdBy: req.user._id,
            isActive: true
        });

        res.status(201).json({ message: 'Ticket template created', ticketTemplate: template });
    } catch (error) {
        console.error('Create ticket template error:', error);
        res.status(500).json({ message: 'Failed to create ticket template', error: error.message });
    }
});

// Update ticket template
router.put('/:companyId/ticket-templates/:id', authenticateToken, requirePermission('TEMPLATE_MANAGE'), async (req, res) => {
    try {
        const template = await TicketTemplate.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!template) {
            return res.status(404).json({ message: 'Ticket template not found' });
        }

        res.json({ message: 'Ticket template updated', ticketTemplate: template });
    } catch (error) {
        console.error('Update ticket template error:', error);
        res.status(500).json({ message: 'Failed to update ticket template', error: error.message });
    }
});

// Delete ticket template
router.delete('/:companyId/ticket-templates/:id', authenticateToken, requirePermission('TEMPLATE_MANAGE'), async (req, res) => {
    try {
        const template = await TicketTemplate.findByIdAndDelete(req.params.id);
        if (!template) {
            return res.status(404).json({ message: 'Ticket template not found' });
        }
        res.json({ message: 'Ticket template deleted' });
    } catch (error) {
        console.error('Delete ticket template error:', error);
        res.status(500).json({ message: 'Failed to delete ticket template' });
    }
});

export default router;
