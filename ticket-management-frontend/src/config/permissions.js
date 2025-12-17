/**
 * Permission Definitions
 * Mirrors the backend permission definitions
 */

export const PERMISSIONS = {
    // Ticket CRUD Operations
    TCKT_CREATE: 'TCKT_CREATE',
    TCKT_UPDATE: 'TCKT_UPDATE',
    TCKT_COMMENT: 'TCKT_COMMENT',
    TCKT_CLOSE: 'TCKT_CLOSE',
    TCKT_REOPEN: 'TCKT_REOPEN',

    // Ticket Viewing
    TCKT_VIEW_ALL: 'TCKT_VIEW_ALL',
    TCKT_VIEW_DEPT: 'TCKT_VIEW_DEPT',
    TCKT_VIEW_ASSIGNED: 'TCKT_VIEW_ASSIGNED',
    TCKT_VIEW_OWN: 'TCKT_VIEW_OWN',

    // Ticket Management
    TCKT_ASSIGN: 'TCKT_ASSIGN',
    TCKT_ESCALATE: 'TCKT_ESCALATE',

    // Configuration
    SLA_CONFIG: 'SLA_CONFIG',
    ROUTE_CONFIG: 'ROUTE_CONFIG',
    TEMPLATE_MANAGE: 'TEMPLATE_MANAGE',
    CANNED_MANAGE: 'CANNED_MANAGE',

    // Analytics
    ANALYTICS_VIEW: 'ANALYTICS_VIEW',
    EXPORT_DATA: 'EXPORT_DATA',
    AUDIT_VIEW: 'AUDIT_VIEW',

    // Deletion
    TCKT_DELETE_SOFT: 'TCKT_DELETE_SOFT',
    TCKT_DELETE_HARD: 'TCKT_DELETE_HARD'
};

export const ROLES = {
    SUPER_ADMIN: 'admin',
    COMPANY_ADMIN: 'company_admin',
    DEPARTMENT_ADMIN: 'department_admin',
    AGENT: 'agent',
    REQUESTER: 'requester'
};
