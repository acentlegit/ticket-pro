/**
 * Permission Definitions and Role-Permission Mappings
 * Based on the enterprise ticket management permission matrix
 */

// Permission IDs and Descriptions
export const PERMISSIONS = {
    // Ticket CRUD Operations
    TCKT_CREATE: {
        id: 'TCKT_CREATE',
        name: 'Create Ticket',
        description: 'Create a new ticket',
        category: 'ticket_crud'
    },
    TCKT_UPDATE: {
        id: 'TCKT_UPDATE',
        name: 'Update Ticket',
        description: 'Update status, priority, fields',
        category: 'ticket_crud'
    },
    TCKT_COMMENT: {
        id: 'TCKT_COMMENT',
        name: 'Comment on Ticket',
        description: 'Add comments to ticket',
        category: 'ticket_crud'
    },
    TCKT_CLOSE: {
        id: 'TCKT_CLOSE',
        name: 'Close Ticket',
        description: 'Close resolved tickets',
        category: 'ticket_crud'
    },
    TCKT_REOPEN: {
        id: 'TCKT_REOPEN',
        name: 'Reopen Ticket',
        description: 'Reopen closed tickets',
        category: 'ticket_crud'
    },

    // Ticket Viewing (Scope-based)
    TCKT_VIEW_ALL: {
        id: 'TCKT_VIEW_ALL',
        name: 'View All Tickets',
        description: 'View all tickets across scope',
        category: 'ticket_view'
    },
    TCKT_VIEW_DEPT: {
        id: 'TCKT_VIEW_DEPT',
        name: 'View Department Tickets',
        description: 'View tickets within department',
        category: 'ticket_view'
    },
    TCKT_VIEW_ASSIGNED: {
        id: 'TCKT_VIEW_ASSIGNED',
        name: 'View Assigned Tickets',
        description: 'View only assigned tickets',
        category: 'ticket_view'
    },
    TCKT_VIEW_OWN: {
        id: 'TCKT_VIEW_OWN',
        name: 'View Own Tickets',
        description: 'View tickets created by self',
        category: 'ticket_view'
    },

    // Ticket Management
    TCKT_ASSIGN: {
        id: 'TCKT_ASSIGN',
        name: 'Assign Ticket',
        description: 'Assign or reassign tickets',
        category: 'ticket_management'
    },
    TCKT_ESCALATE: {
        id: 'TCKT_ESCALATE',
        name: 'Escalate Ticket',
        description: 'Escalate ticket manually',
        category: 'ticket_management'
    },

    // Configuration
    SLA_CONFIG: {
        id: 'SLA_CONFIG',
        name: 'Configure SLA',
        description: 'Create or edit SLA rules',
        category: 'configuration'
    },
    ROUTE_CONFIG: {
        id: 'ROUTE_CONFIG',
        name: 'Configure Routing',
        description: 'Configure auto-routing rules',
        category: 'configuration'
    },
    TEMPLATE_MANAGE: {
        id: 'TEMPLATE_MANAGE',
        name: 'Manage Templates',
        description: 'Create/edit ticket templates',
        category: 'configuration'
    },
    CANNED_MANAGE: {
        id: 'CANNED_MANAGE',
        name: 'Manage Canned Responses',
        description: 'Create/edit canned responses',
        category: 'configuration'
    },

    // Analytics & Reporting
    ANALYTICS_VIEW: {
        id: 'ANALYTICS_VIEW',
        name: 'View Analytics',
        description: 'View dashboards and metrics',
        category: 'analytics'
    },
    EXPORT_DATA: {
        id: 'EXPORT_DATA',
        name: 'Export Tickets',
        description: 'Export ticket data',
        category: 'analytics'
    },
    AUDIT_VIEW: {
        id: 'AUDIT_VIEW',
        name: 'View Audit Logs',
        description: 'View ticket audit logs',
        category: 'analytics'
    },

    // Deletion
    TCKT_DELETE_SOFT: {
        id: 'TCKT_DELETE_SOFT',
        name: 'Soft Delete Ticket',
        description: 'Soft delete ticket',
        category: 'deletion'
    },
    TCKT_DELETE_HARD: {
        id: 'TCKT_DELETE_HARD',
        name: 'Hard Delete Ticket',
        description: 'Permanently delete ticket',
        category: 'deletion'
    }
};

// Role Definitions
export const ROLES = {
    SUPER_ADMIN: 'admin',
    COMPANY_ADMIN: 'company_admin',
    DEPARTMENT_ADMIN: 'department_admin',
    AGENT: 'agent',
    REQUESTER: 'requester'
};

// Role-Permission Mapping
export const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: [
        'TCKT_CREATE',
        'TCKT_VIEW_ALL',
        'TCKT_VIEW_DEPT',
        'TCKT_VIEW_ASSIGNED',
        'TCKT_VIEW_OWN',
        'TCKT_UPDATE',
        'TCKT_COMMENT',
        'TCKT_CLOSE',
        'TCKT_REOPEN',
        'TCKT_ASSIGN',
        'TCKT_ESCALATE',
        'SLA_CONFIG',
        'ROUTE_CONFIG',
        'TEMPLATE_MANAGE',
        'CANNED_MANAGE',
        'ANALYTICS_VIEW',
        'EXPORT_DATA',
        'AUDIT_VIEW',
        'TCKT_DELETE_SOFT',
        'TCKT_DELETE_HARD'
    ],

    [ROLES.COMPANY_ADMIN]: [
        'TCKT_CREATE',
        'TCKT_VIEW_ALL',
        'TCKT_VIEW_DEPT',
        'TCKT_VIEW_ASSIGNED',
        'TCKT_VIEW_OWN',
        'TCKT_UPDATE',
        'TCKT_COMMENT',
        'TCKT_CLOSE',
        'TCKT_REOPEN',
        'TCKT_ASSIGN',
        'TCKT_ESCALATE',
        'SLA_CONFIG',
        'ROUTE_CONFIG',
        'TEMPLATE_MANAGE',
        'CANNED_MANAGE',
        'ANALYTICS_VIEW',
        'EXPORT_DATA',
        'AUDIT_VIEW',
        'TCKT_DELETE_SOFT'
    ],

    [ROLES.DEPARTMENT_ADMIN]: [
        'TCKT_CREATE',
        'TCKT_VIEW_DEPT',
        'TCKT_VIEW_ASSIGNED',
        'TCKT_VIEW_OWN',
        'TCKT_UPDATE',
        'TCKT_COMMENT',
        'TCKT_CLOSE',
        'TCKT_REOPEN',
        'TCKT_ASSIGN',
        'TCKT_ESCALATE',
        'CANNED_MANAGE',
        'ANALYTICS_VIEW'
    ],

    [ROLES.AGENT]: [
        'TCKT_CREATE',
        'TCKT_VIEW_DEPT',
        'TCKT_VIEW_ASSIGNED',
        'TCKT_VIEW_OWN',
        'TCKT_UPDATE',
        'TCKT_COMMENT',
        'TCKT_CLOSE',
        'TCKT_REOPEN', // Limited
        'TCKT_ESCALATE',
        'ANALYTICS_VIEW' // Personal only
    ],

    [ROLES.REQUESTER]: [
        'TCKT_CREATE',
        'TCKT_VIEW_OWN',
        'TCKT_COMMENT',
        'TCKT_REOPEN' // SLA-bound
    ]
};

// Permission Categories
export const PERMISSION_CATEGORIES = {
    ticket_crud: 'Ticket Operations',
    ticket_view: 'Ticket Viewing',
    ticket_management: 'Ticket Management',
    configuration: 'System Configuration',
    analytics: 'Analytics & Reporting',
    deletion: 'Deletion Operations'
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permissionId - Permission ID to check
 * @returns {boolean}
 */
export const hasPermission = (role, permissionId) => {
    if (!role || !permissionId) return false;
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    return rolePermissions.includes(permissionId);
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {Array<string>}
 */
export const getRolePermissions = (role) => {
    return ROLE_PERMISSIONS[role] || [];
};

/**
 * Get permission details
 * @param {string} permissionId - Permission ID
 * @returns {Object|null}
 */
export const getPermissionDetails = (permissionId) => {
    return PERMISSIONS[permissionId] || null;
};

/**
 * Get all permissions grouped by category
 * @returns {Object}
 */
export const getPermissionsByCategory = () => {
    const grouped = {};

    Object.values(PERMISSIONS).forEach(permission => {
        const category = permission.category;
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(permission);
    });

    return grouped;
};

/**
 * Helper to safely get string ID from potentially populated field
 */
const getId = (field) => {
    if (!field) return null;
    if (typeof field === 'string') return field;
    if (field._id) return field._id.toString();
    return field.toString();
};

/**
 * Check if user can view a specific ticket based on their role
 * @param {Object} user - User object with role, departmentId, companyId
 * @param {Object} ticket - Ticket object
 * @returns {boolean}
 */
export const canViewTicket = (user, ticket) => {
    const role = user.role;

    // Super Admin can view all tickets
    if (role === ROLES.SUPER_ADMIN) {
        return true;
    }

    // Company Admin can view all tickets in their company
    if (role === ROLES.COMPANY_ADMIN) {
        return getId(ticket.companyId) === getId(user.companyId);
    }

    // Department Admin can view tickets in their department
    if (role === ROLES.DEPARTMENT_ADMIN) {
        return getId(ticket.departmentId) === getId(user.departmentId);
    }

    // Agent can view assigned tickets or department tickets
    if (role === ROLES.AGENT) {
        const isAssigned = getId(ticket.assignedAgentId) === user._id.toString() ||
            getId(ticket.assignedTo) === user._id.toString(); // Check both fields
        const isDeptTicket = getId(ticket.departmentId) === getId(user.departmentId);
        return isAssigned || isDeptTicket;
    }

    // Requester can only view their own tickets
    if (role === ROLES.REQUESTER) {
        return getId(ticket.createdBy) === user._id.toString() ||
            getId(ticket.contactId) === getId(user.contactId); // Assuming user has contactId linked
    }

    return false;
};

/**
 * Check if user can update a specific ticket
 * @param {Object} user - User object
 * @param {Object} ticket - Ticket object
 * @returns {boolean}
 */
export const canUpdateTicket = (user, ticket) => {
    const role = user.role;

    // Super Admin and Company Admin can update any ticket in their scope
    if (role === ROLES.SUPER_ADMIN || role === ROLES.COMPANY_ADMIN) {
        return hasPermission(role, 'TCKT_UPDATE');
    }

    // Department Admin can update tickets in their department
    if (role === ROLES.DEPARTMENT_ADMIN) {
        return getId(ticket.departmentId) === getId(user.departmentId);
    }

    // Agent can update only assigned tickets
    if (role === ROLES.AGENT) {
        return getId(ticket.assignedAgentId) === user._id.toString() ||
            getId(ticket.assignedTo) === user._id.toString();
    }

    // Requester cannot update tickets (only comment)
    return false;
};

/**
 * Check if user can assign/reassign a ticket
 * @param {Object} user - User object
 * @param {Object} ticket - Ticket object
 * @returns {boolean}
 */
export const canAssignTicket = (user, ticket) => {
    const role = user.role;

    if (!hasPermission(role, 'TCKT_ASSIGN')) {
        return false;
    }

    // Super Admin can assign any ticket
    if (role === ROLES.SUPER_ADMIN) {
        return true;
    }

    // Company Admin can assign tickets in their company
    if (role === ROLES.COMPANY_ADMIN) {
        return getId(ticket.companyId) === getId(user.companyId);
    }

    // Department Admin can assign tickets in their department
    if (role === ROLES.DEPARTMENT_ADMIN) {
        return getId(ticket.departmentId) === getId(user.departmentId);
    }

    return false;
};

export default {
    PERMISSIONS,
    ROLES,
    ROLE_PERMISSIONS,
    PERMISSION_CATEGORIES,
    hasPermission,
    getRolePermissions,
    getPermissionDetails,
    getPermissionsByCategory,
    canViewTicket,
    canUpdateTicket,
    canAssignTicket
};
