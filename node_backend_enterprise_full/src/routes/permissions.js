/**
 * Permissions API Routes
 * Provides endpoints for managing and querying permissions
 */

import express from 'express';
import {
    PERMISSIONS,
    ROLES,
    ROLE_PERMISSIONS,
    PERMISSION_CATEGORIES,
    getRolePermissions,
    getPermissionsByCategory,
    hasPermission
} from '../config/permissions.js';
import { requirePermission, requireRole } from '../middleware/permissions.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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

/**
 * GET /permissions
 * Get all available permissions
 */
router.get('/permissions', authenticateToken, (req, res) => {
    try {
        const permissions = Object.values(PERMISSIONS);

        res.json({
            success: true,
            count: permissions.length,
            permissions
        });
    } catch (error) {
        console.error('Get permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch permissions',
            error: error.message
        });
    }
});

/**
 * GET /permissions/categories
 * Get permissions grouped by category
 */
router.get('/permissions/categories', authenticateToken, (req, res) => {
    try {
        const categorized = getPermissionsByCategory();

        res.json({
            success: true,
            categories: PERMISSION_CATEGORIES,
            permissions: categorized
        });
    } catch (error) {
        console.error('Get categorized permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categorized permissions',
            error: error.message
        });
    }
});

/**
 * GET /permissions/roles
 * Get all available roles
 */
router.get('/permissions/roles', authenticateToken, (req, res) => {
    try {
        const roles = Object.entries(ROLES).map(([key, value]) => ({
            key,
            value,
            name: key.split('_').map(word =>
                word.charAt(0) + word.slice(1).toLowerCase()
            ).join(' ')
        }));

        res.json({
            success: true,
            count: roles.length,
            roles
        });
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch roles',
            error: error.message
        });
    }
});

/**
 * GET /permissions/role/:role
 * Get permissions for a specific role
 */
router.get('/permissions/role/:role', authenticateToken, (req, res) => {
    try {
        const { role } = req.params;
        const permissions = getRolePermissions(role);

        if (!permissions || permissions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Role not found or has no permissions'
            });
        }

        // Get full permission details
        const permissionDetails = permissions.map(permId => PERMISSIONS[permId]).filter(Boolean);

        res.json({
            success: true,
            role,
            count: permissions.length,
            permissionIds: permissions,
            permissions: permissionDetails
        });
    } catch (error) {
        console.error('Get role permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch role permissions',
            error: error.message
        });
    }
});

/**
 * GET /permissions/my-permissions
 * Get current user's permissions
 */
router.get('/permissions/my-permissions', authenticateToken, (req, res) => {
    try {
        const userRole = req.user.role;
        const permissions = getRolePermissions(userRole);
        const permissionDetails = permissions.map(permId => PERMISSIONS[permId]).filter(Boolean);

        res.json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.fullName,
                email: req.user.email,
                role: userRole
            },
            count: permissions.length,
            permissionIds: permissions,
            permissions: permissionDetails
        });
    } catch (error) {
        console.error('Get my permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your permissions',
            error: error.message
        });
    }
});

/**
 * POST /permissions/check
 * Check if current user has specific permission(s)
 * Body: { permission: 'TCKT_CREATE' } or { permissions: ['TCKT_CREATE', 'TCKT_UPDATE'] }
 */
router.post('/permissions/check', authenticateToken, (req, res) => {
    try {
        const { permission, permissions } = req.body;
        const userRole = req.user.role;

        if (permission) {
            // Check single permission
            const hasAccess = hasPermission(userRole, permission);
            return res.json({
                success: true,
                permission,
                hasPermission: hasAccess
            });
        }

        if (permissions && Array.isArray(permissions)) {
            // Check multiple permissions
            const results = permissions.map(perm => ({
                permission: perm,
                hasPermission: hasPermission(userRole, perm)
            }));

            return res.json({
                success: true,
                results,
                hasAll: results.every(r => r.hasPermission),
                hasAny: results.some(r => r.hasPermission)
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Please provide "permission" or "permissions" in request body'
        });
    } catch (error) {
        console.error('Check permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check permissions',
            error: error.message
        });
    }
});

/**
 * GET /permissions/matrix
 * Get complete role-permission matrix
 * Restricted to admins only
 */
router.get('/permissions/matrix',
    authenticateToken,
    requireRole(['admin', 'company_admin']),
    (req, res) => {
        try {
            const matrix = Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({
                role,
                permissionCount: permissions.length,
                permissions
            }));

            res.json({
                success: true,
                matrix,
                allPermissions: Object.keys(PERMISSIONS),
                allRoles: Object.values(ROLES)
            });
        } catch (error) {
            console.error('Get permission matrix error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch permission matrix',
                error: error.message
            });
        }
    }
);

/**
 * GET /permissions/user/:userId
 * Get permissions for a specific user
 * Restricted to admins
 */
router.get('/permissions/user/:userId',
    authenticateToken,
    requireRole(['admin', 'company_admin']),
    async (req, res) => {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId).select('fullName email role companyId departmentId');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const permissions = getRolePermissions(user.role);
            const permissionDetails = permissions.map(permId => PERMISSIONS[permId]).filter(Boolean);

            res.json({
                success: true,
                user: {
                    id: user._id,
                    name: user.fullName,
                    email: user.email,
                    role: user.role,
                    companyId: user.companyId,
                    departmentId: user.departmentId
                },
                count: permissions.length,
                permissionIds: permissions,
                permissions: permissionDetails
            });
        } catch (error) {
            console.error('Get user permissions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user permissions',
                error: error.message
            });
        }
    }
);

/**
 * GET /permissions/compare
 * Compare permissions between roles
 * Query: ?roles=admin,company_admin,agent
 */
router.get('/permissions/compare',
    authenticateToken,
    requireRole(['admin', 'company_admin']),
    (req, res) => {
        try {
            const { roles } = req.query;

            if (!roles) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide roles query parameter (comma-separated)'
                });
            }

            const roleList = roles.split(',').map(r => r.trim());
            const comparison = {};

            roleList.forEach(role => {
                comparison[role] = getRolePermissions(role);
            });

            // Find common permissions
            const allPermissionSets = Object.values(comparison);
            const commonPermissions = allPermissionSets.reduce((common, perms) =>
                common.filter(p => perms.includes(p))
            );

            // Find unique permissions per role
            const uniquePermissions = {};
            roleList.forEach(role => {
                uniquePermissions[role] = comparison[role].filter(perm =>
                    !roleList.some(otherRole =>
                        otherRole !== role && comparison[otherRole]?.includes(perm)
                    )
                );
            });

            res.json({
                success: true,
                roles: roleList,
                comparison,
                commonPermissions,
                uniquePermissions
            });
        } catch (error) {
            console.error('Compare permissions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to compare permissions',
                error: error.message
            });
        }
    }
);

export default router;
