/**
 * Permission Checking Middleware
 * Provides middleware functions for protecting routes with permission checks
 */

import { hasPermission, canViewTicket, canUpdateTicket, canAssignTicket } from '../config/permissions.js';

/**
 * Middleware to check if user has a specific permission
 * @param {string} permissionId - Permission ID to check
 * @returns {Function} Express middleware
 */
export const requirePermission = (permissionId) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        const userRole = req.user.role;

        if (!hasPermission(userRole, permissionId)) {
            return res.status(403).json({
                message: 'Insufficient permissions',
                code: 'PERMISSION_DENIED',
                required: permissionId,
                userRole: userRole
            });
        }

        next();
    };
};

/**
 * Middleware to check if user has ANY of the specified permissions
 * @param {Array<string>} permissionIds - Array of permission IDs
 * @returns {Function} Express middleware
 */
export const requireAnyPermission = (permissionIds) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        const userRole = req.user.role;
        const hasAnyPermission = permissionIds.some(permId => hasPermission(userRole, permId));

        if (!hasAnyPermission) {
            return res.status(403).json({
                message: 'Insufficient permissions',
                code: 'PERMISSION_DENIED',
                required: permissionIds,
                userRole: userRole
            });
        }

        next();
    };
};

/**
 * Middleware to check if user has ALL of the specified permissions
 * @param {Array<string>} permissionIds - Array of permission IDs
 * @returns {Function} Express middleware
 */
export const requireAllPermissions = (permissionIds) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        const userRole = req.user.role;
        const hasAllPermissions = permissionIds.every(permId => hasPermission(userRole, permId));

        if (!hasAllPermissions) {
            const missingPermissions = permissionIds.filter(permId => !hasPermission(userRole, permId));
            return res.status(403).json({
                message: 'Insufficient permissions',
                code: 'PERMISSION_DENIED',
                missing: missingPermissions,
                userRole: userRole
            });
        }

        next();
    };
};

/**
 * Middleware to check if user is one of the allowed roles
 * @param {Array<string>} allowedRoles - Array of allowed role names
 * @returns {Function} Express middleware
 */
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                message: 'Access denied for your role',
                code: 'ROLE_DENIED',
                required: allowedRoles,
                userRole: userRole
            });
        }

        next();
    };
};

/**
 * Middleware to check if user can view a specific ticket
 * Requires ticket to be loaded in req.ticket
 * @returns {Function} Express middleware
 */
export const canViewTicketMiddleware = () => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        if (!req.ticket) {
            return res.status(500).json({
                message: 'Ticket not loaded',
                code: 'INTERNAL_ERROR'
            });
        }

        if (!canViewTicket(req.user, req.ticket)) {
            return res.status(403).json({
                message: 'You do not have permission to view this ticket',
                code: 'TICKET_VIEW_DENIED'
            });
        }

        next();
    };
};

/**
 * Middleware to check if user can update a specific ticket
 * Requires ticket to be loaded in req.ticket
 * @returns {Function} Express middleware
 */
export const canUpdateTicketMiddleware = () => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        if (!req.ticket) {
            return res.status(500).json({
                message: 'Ticket not loaded',
                code: 'INTERNAL_ERROR'
            });
        }

        if (!canUpdateTicket(req.user, req.ticket)) {
            return res.status(403).json({
                message: 'You do not have permission to update this ticket',
                code: 'TICKET_UPDATE_DENIED'
            });
        }

        next();
    };
};

/**
 * Middleware to check if user can assign a specific ticket
 * Requires ticket to be loaded in req.ticket
 * @returns {Function} Express middleware
 */
export const canAssignTicketMiddleware = () => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        if (!req.ticket) {
            return res.status(500).json({
                message: 'Ticket not loaded',
                code: 'INTERNAL_ERROR'
            });
        }

        if (!canAssignTicket(req.user, req.ticket)) {
            return res.status(403).json({
                message: 'You do not have permission to assign this ticket',
                code: 'TICKET_ASSIGN_DENIED'
            });
        }

        next();
    };
};

/**
 * Middleware to load ticket and attach to request
 * @param {Object} Ticket - Ticket model
 * @returns {Function} Express middleware
 */
export const loadTicket = (Ticket) => {
    return async (req, res, next) => {
        try {
            const ticketId = req.params.id || req.params.ticketId;

            if (!ticketId) {
                return res.status(400).json({
                    message: 'Ticket ID required',
                    code: 'TICKET_ID_REQUIRED'
                });
            }

            const ticket = await Ticket.findById(ticketId)
                .populate('assignedAgentId', 'fullName email role')
                .populate('createdBy', 'fullName email role')
                .populate('companyId', 'companyName')
                .populate('departmentId', 'name');

            if (!ticket) {
                return res.status(404).json({
                    message: 'Ticket not found',
                    code: 'TICKET_NOT_FOUND'
                });
            }

            req.ticket = ticket;
            next();
        } catch (error) {
            console.error('Error loading ticket:', error);
            return res.status(500).json({
                message: 'Error loading ticket',
                code: 'INTERNAL_ERROR',
                error: error.message
            });
        }
    };
};

/**
 * Middleware to check if user owns the resource
 * @param {string} resourceUserField - Field name containing user ID (e.g., 'createdBy')
 * @returns {Function} Express middleware
 */
export const requireOwnership = (resourceUserField = 'createdBy') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        const resource = req.ticket || req.resource;

        if (!resource) {
            return res.status(500).json({
                message: 'Resource not loaded',
                code: 'INTERNAL_ERROR'
            });
        }

        const resourceUserId = resource[resourceUserField]?.toString();
        const currentUserId = req.user._id?.toString();

        if (resourceUserId !== currentUserId) {
            return res.status(403).json({
                message: 'You can only access your own resources',
                code: 'OWNERSHIP_REQUIRED'
            });
        }

        next();
    };
};

/**
 * Middleware to check company scope
 * Ensures user can only access resources in their company
 * @returns {Function} Express middleware
 */
export const requireCompanyScope = () => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        // Super admin can access all companies
        if (req.user.role === 'admin') {
            return next();
        }

        const resource = req.ticket || req.resource;

        if (!resource) {
            return res.status(500).json({
                message: 'Resource not loaded',
                code: 'INTERNAL_ERROR'
            });
        }

        const resourceCompanyId = resource.companyId?.toString();
        const userCompanyId = req.user.companyId?.toString();

        if (resourceCompanyId !== userCompanyId) {
            return res.status(403).json({
                message: 'You can only access resources in your company',
                code: 'COMPANY_SCOPE_DENIED'
            });
        }

        next();
    };
};

/**
 * Middleware to check department scope
 * Ensures user can only access resources in their department
 * @returns {Function} Express middleware
 */
export const requireDepartmentScope = () => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        // Super admin and company admin can access all departments
        if (req.user.role === 'admin' || req.user.role === 'supervisor') {
            return next();
        }

        const resource = req.ticket || req.resource;

        if (!resource) {
            return res.status(500).json({
                message: 'Resource not loaded',
                code: 'INTERNAL_ERROR'
            });
        }

        const resourceDeptId = resource.departmentId?.toString();
        const userDeptId = req.user.departmentId?.toString();

        if (resourceDeptId !== userDeptId) {
            return res.status(403).json({
                message: 'You can only access resources in your department',
                code: 'DEPARTMENT_SCOPE_DENIED'
            });
        }

        next();
    };
};

export default {
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,
    requireRole,
    canViewTicketMiddleware,
    canUpdateTicketMiddleware,
    canAssignTicketMiddleware,
    loadTicket,
    requireOwnership,
    requireCompanyScope,
    requireDepartmentScope
};
