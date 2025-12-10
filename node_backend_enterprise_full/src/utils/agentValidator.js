/**
 * Validate agent data from CSV/Excel row
 * @param {Object} row - Row data from CSV/Excel
 * @returns {Object} - { valid: boolean, errors: Array }
 */
export const validateAgentData = (row) => {
    const errors = [];

    // Required fields
    if (!row['First Name'] || row['First Name'].trim() === '') {
        errors.push({ field: 'First Name', message: 'First Name is required' });
    }

    if (!row['Last Name'] || row['Last Name'].trim() === '') {
        errors.push({ field: 'Last Name', message: 'Last Name is required' });
    }

    if (!row.Email || row.Email.trim() === '') {
        errors.push({ field: 'Email', message: 'Email is required' });
    }

    // Validate email format
    if (row.Email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.Email)) {
            errors.push({ field: 'Email', message: 'Invalid email format' });
        }
    }

    // Validate role
    const validRoles = ['admin', 'supervisor', 'agent'];
    if (row.Role && !validRoles.includes(row.Role.toLowerCase())) {
        errors.push({
            field: 'Role',
            message: `Role must be one of: ${validRoles.join(', ')}`
        });
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'suspended'];
    if (row.Status && !validStatuses.includes(row.Status.toLowerCase())) {
        errors.push({
            field: 'Status',
            message: `Status must be one of: ${validStatuses.join(', ')}`
        });
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Sanitize and normalize agent data
 * @param {Object} row - Row data from CSV/Excel
 * @returns {Object} - Normalized agent data
 */
export const normalizeAgentData = (row) => {
    return {
        firstName: row['First Name']?.trim(),
        lastName: row['Last Name']?.trim(),
        fullName: `${row['First Name']?.trim()} ${row['Last Name']?.trim()}`,
        email: row.Email?.trim().toLowerCase(),
        phoneNumber: row['Phone Number']?.trim(),
        mobile: row.Mobile?.trim(),
        fax: row.Fax?.trim(),
        role: row.Role?.toLowerCase() || 'agent',
        status: row.Status?.toLowerCase() || 'inactive',
        teamName: row.Team?.trim(),
        channelExpert: row['Channel Expert']?.trim(),
        about: row.About?.trim()
    };
};
