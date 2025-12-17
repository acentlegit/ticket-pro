import express from 'express';
import AuditLog from '../models/AuditLog.js';
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

// Get audit logs
router.get('/:companyId/audit-logs', authenticateToken, requirePermission('AUDIT_VIEW'), async (req, res) => {
    try {
        const { companyId } = req.params;
        const { entityType, action, startDate, endDate, page = 1, limit = 50 } = req.query;

        const filter = { companyId };
        if (entityType) filter.entityType = entityType;
        if (action) filter.action = action;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(filter)
            .populate('performedBy', 'fullName email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AuditLog.countDocuments(filter);

        res.json({
            auditLogs: logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
});

// Get audit logs for specific entity
router.get('/:companyId/audit-logs/entity/:entityType/:entityId', authenticateToken, requirePermission('AUDIT_VIEW'), async (req, res) => {
    try {
        const { entityType, entityId } = req.params;

        const logs = await AuditLog.find({ entityType, entityId })
            .populate('performedBy', 'fullName email')
            .sort({ createdAt: -1 });

        res.json({ auditLogs: logs });
    } catch (error) {
        console.error('Get entity audit logs error:', error);
        res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
});

// Get audit log statistics
router.get('/:companyId/audit-logs/stats', authenticateToken, requirePermission('AUDIT_VIEW'), async (req, res) => {
    try {
        const { companyId } = req.params;
        const { days = 30 } = req.query;

        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const stats = await AuditLog.aggregate([
            { $match: { companyId: companyId, createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { action: '$action', entityType: '$entityType' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const byAction = {};
        const byEntityType = {};

        stats.forEach(item => {
            const { action, entityType } = item._id;
            byAction[action] = (byAction[action] || 0) + item.count;
            byEntityType[entityType] = (byEntityType[entityType] || 0) + item.count;
        });

        res.json({
            stats: {
                byAction,
                byEntityType,
                total: Object.values(byAction).reduce((a, b) => a + b, 0)
            }
        });
    } catch (error) {
        console.error('Get audit stats error:', error);
        res.status(500).json({ message: 'Failed to fetch audit statistics' });
    }
});

export default router;
