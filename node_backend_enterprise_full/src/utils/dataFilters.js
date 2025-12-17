/**
 * Data Filtering Utilities
 * Provides functions to filter queries based on user roles and permissions
 */

import { ROLES } from '../config/permissions.js';

/**
 * Get ticket filter based on user role and permissions
 * @param {Object} user - User object with role, companyId, departmentId, _id
 * @param {Object} additionalFilters - Additional filters to apply
 * @returns {Object} MongoDB filter object
 */
export const getTicketFilter = (user, additionalFilters = {}) => {
    if (!user) {
        throw new Error('User is required for filtering');
    }

    const role = user.role;
    let filter = { ...additionalFilters };

    switch (role) {
        case ROLES.SUPER_ADMIN:
            // Super Admin can see all tickets across all tenants
            // No additional filter needed
            break;

        case ROLES.COMPANY_ADMIN:
            // Company Admin can see all tickets in their company
            if (user.companyId) {
                filter.companyId = user.companyId;
            }
            break;

        case ROLES.DEPARTMENT_ADMIN:
            // Department Admin can see tickets in their department
            if (user.departmentId) {
                filter.departmentId = user.departmentId;
            }
            if (user.companyId) {
                filter.companyId = user.companyId;
            }
            break;

        case ROLES.AGENT:
            // Agent can see assigned tickets + department tickets
            if (user.departmentId) {
                filter.$or = [
                    { assignedAgentId: user._id },
                    { departmentId: user.departmentId }
                ];
            } else {
                filter.assignedAgentId = user._id;
            }
            if (user.companyId) {
                filter.companyId = user.companyId;
            }
            break;

        case ROLES.REQUESTER:
            // Requester can only see their own tickets
            filter.createdBy = user._id;
            break;

        default:
            // Unknown role - restrict to own tickets only
            filter.createdBy = user._id;
            break;
    }

    return filter;
};

/**
 * Get analytics filter based on user role
 * @param {Object} user - User object
 * @param {Object} additionalFilters - Additional filters
 * @returns {Object} MongoDB filter object
 */
export const getAnalyticsFilter = (user, additionalFilters = {}) => {
    const role = user.role;
    let filter = { ...additionalFilters };

    switch (role) {
        case ROLES.SUPER_ADMIN:
            // Global analytics - no filter
            break;

        case ROLES.COMPANY_ADMIN:
            // Company-wide analytics
            if (user.companyId) {
                filter.companyId = user.companyId;
            }
            break;

        case ROLES.DEPARTMENT_ADMIN:
            // Department analytics
            if (user.departmentId) {
                filter.departmentId = user.departmentId;
            }
            break;

        case ROLES.AGENT:
            // Personal analytics only
            filter.assignedAgentId = user._id;
            break;

        case ROLES.REQUESTER:
            // No analytics access
            filter._id = null; // Will return no results
            break;

        default:
            filter._id = null;
            break;
    }

    return filter;
};

/**
 * Get user filter based on role (for user management)
 * @param {Object} user - Current user object
 * @param {Object} additionalFilters - Additional filters
 * @returns {Object} MongoDB filter object
 */
export const getUserFilter = (user, additionalFilters = {}) => {
    const role = user.role;
    let filter = { ...additionalFilters };

    switch (role) {
        case ROLES.SUPER_ADMIN:
            // Can see all users across all companies
            break;

        case ROLES.COMPANY_ADMIN:
            const allowedCompanies = Array.isArray(user.companyId) ? user.companyId : (user.companyId ? [user.companyId] : []);

            if (filter.companyId) {
                // If filtering by specific company, ensure it's allowed
                // Handle filter.companyId being string or object/query
                const requested = filter.companyId.toString();
                const isAllowed = allowedCompanies.some(id => id.toString() === requested);
                if (!isAllowed) {
                    filter._id = null; // Block access
                }
            } else if (allowedCompanies.length > 0) {
                // Restrict to allowed companies
                filter.companyId = { $in: allowedCompanies };
            } else {
                // No allowed companies?
                filter._id = null;
            }
            break;

        case ROLES.DEPARTMENT_ADMIN:
            // Can see users in their department
            if (user.departmentId) {
                filter.departmentId = user.departmentId;
            }
            break;

        case ROLES.AGENT:
        case ROLES.REQUESTER:
            // Can only see themselves
            filter._id = user._id;
            break;

        default:
            filter._id = user._id;
            break;
    }

    return filter;
};

/**
 * Get department filter based on role
 * @param {Object} user - Current user object
 * @param {Object} additionalFilters - Additional filters
 * @returns {Object} MongoDB filter object
 */
export const getDepartmentFilter = (user, additionalFilters = {}) => {
    const role = user.role;
    let filter = { ...additionalFilters };

    switch (role) {
        case ROLES.SUPER_ADMIN:
            // Can see all departments
            break;

        case ROLES.COMPANY_ADMIN:
            // Can see departments in their company
            if (user.companyId) {
                filter.companyId = user.companyId;
            }
            break;

        case ROLES.DEPARTMENT_ADMIN:
        case ROLES.AGENT:
            // Can see their own department
            if (user.departmentId) {
                filter._id = user.departmentId;
            }
            break;

        case ROLES.REQUESTER:
            // No access to departments
            filter._id = null;
            break;

        default:
            filter._id = null;
            break;
    }

    return filter;
};

/**
 * Get company filter based on role
 * @param {Object} user - Current user object
 * @param {Object} additionalFilters - Additional filters
 * @returns {Object} MongoDB filter object
 */
export const getCompanyFilter = (user, additionalFilters = {}) => {
    const role = user.role;
    let filter = { ...additionalFilters };

    switch (role) {
        case ROLES.SUPER_ADMIN:
            // Can see all companies
            break;

        case ROLES.COMPANY_ADMIN:
        case ROLES.DEPARTMENT_ADMIN:
        case ROLES.AGENT:
            // Can see their own company
            if (user.companyId) {
                filter._id = { $in: user.companyId };
            }
            break;

        case ROLES.REQUESTER:
            // Can see their company
            if (user.companyId) {
                filter._id = { $in: user.companyId };
            }
            break;

        default:
            filter._id = null;
            break;
    }

    return filter;
};

/**
 * Check if user can access a specific company
 * @param {Object} user - User object
 * @param {string} companyId - Company ID to check
 * @returns {boolean}
 */
export const canAccessCompany = (user, companyId) => {
    if (!user || !companyId) return false;

    // Super Admin can access all companies
    if (user.role === ROLES.SUPER_ADMIN) {
        return true;
    }

    // Check if company is in user's companyId array
    if (Array.isArray(user.companyId)) {
        return user.companyId.some(id => id.toString() === companyId.toString());
    }

    // Check if it's the user's company
    return user.companyId?.toString() === companyId.toString();
};

/**
 * Check if user can access a specific department
 * @param {Object} user - User object
 * @param {string} departmentId - Department ID to check
 * @returns {boolean}
 */
export const canAccessDepartment = (user, departmentId) => {
    if (!user || !departmentId) return false;

    // Super Admin and Company Admin can access all departments in their scope
    if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.COMPANY_ADMIN) {
        return true;
    }

    // Department Admin and Agent can access their own department
    return user.departmentId?.toString() === departmentId.toString();
};

/**
 * Get assignable users filter (for ticket assignment)
 * @param {Object} user - Current user object
 * @param {Object} ticket - Ticket object (optional)
 * @returns {Object} MongoDB filter object
 */
export const getAssignableUsersFilter = (user, ticket = null) => {
    const role = user.role;
    let filter = { role: { $in: ['agent', 'supervisor', 'department_admin'] } };

    switch (role) {
        case ROLES.SUPER_ADMIN:
            // Can assign to anyone
            break;

        case ROLES.COMPANY_ADMIN:
            // Can assign to users in their company
            if (user.companyId) {
                filter.companyId = { $in: [user.companyId] };
            }
            break;

        case ROLES.DEPARTMENT_ADMIN:
            // Can assign to users in their department
            if (user.departmentId) {
                filter.departmentId = user.departmentId;
            }
            break;

        case ROLES.AGENT:
        case ROLES.REQUESTER:
            // Cannot assign tickets
            filter._id = null;
            break;

        default:
            filter._id = null;
            break;
    }

    return filter;
};

/**
 * Apply pagination and sorting
 * @param {Object} query - Mongoose query object
 * @param {Object} options - Pagination options { page, limit, sort }
 * @returns {Object} Modified query
 */
export const applyPagination = (query, options = {}) => {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 50;
    const skip = (page - 1) * limit;

    if (options.sort) {
        query = query.sort(options.sort);
    } else {
        query = query.sort({ createdAt: -1 }); // Default sort by newest first
    }

    return query.skip(skip).limit(limit);
};

/**
 * Get pagination metadata
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
export const getPaginationMeta = (total, page = 1, limit = 50) => {
    const totalPages = Math.ceil(total / limit);

    return {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };
};

export default {
    getTicketFilter,
    getAnalyticsFilter,
    getUserFilter,
    getDepartmentFilter,
    getCompanyFilter,
    canAccessCompany,
    canAccessDepartment,
    getAssignableUsersFilter,
    applyPagination,
    getPaginationMeta
};
