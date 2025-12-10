/**
 * Validate ticket data from CSV/Excel row
 * @param {Object} row - Row data from CSV/Excel
 * @returns {Object} - { valid: boolean, errors: Array }
 */
export const validateTicketData = (row) => {
    const errors = [];

    // Required fields
    if (!row.Subject || row.Subject.trim() === '') {
        errors.push({ field: 'Subject', message: 'Subject is required' });
    } else if (row.Subject.length > 255) {
        errors.push({ field: 'Subject', message: 'Subject cannot exceed 255 characters' });
    }

    if (!row.Description || row.Description.trim() === '') {
        errors.push({ field: 'Description', message: 'Description is required' });
    }

    if (!row.Priority || row.Priority.trim() === '') {
        errors.push({ field: 'Priority', message: 'Priority is required' });
    }

    // Validate enum values
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (row.Priority && !validPriorities.includes(row.Priority.toLowerCase())) {
        errors.push({
            field: 'Priority',
            message: `Priority must be one of: ${validPriorities.join(', ')}`
        });
    }

    const validStatuses = ['open', 'in-progress', 'pending', 'resolved', 'closed'];
    if (row.Status && !validStatuses.includes(row.Status.toLowerCase())) {
        errors.push({
            field: 'Status',
            message: `Status must be one of: ${validStatuses.join(', ')}`
        });
    }

    const validChannels = ['email', 'phone', 'chat', 'web', 'social', 'api'];
    if (row.Channel && !validChannels.includes(row.Channel.toLowerCase())) {
        errors.push({
            field: 'Channel',
            message: `Channel must be one of: ${validChannels.join(', ')}`
        });
    }

    // Validate email format
    if (row['Contact Email']) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row['Contact Email'])) {
            errors.push({ field: 'Contact Email', message: 'Invalid email format' });
        }
    }

    // Validate date format
    if (row['Due Date']) {
        const date = new Date(row['Due Date']);
        if (isNaN(date.getTime())) {
            errors.push({ field: 'Due Date', message: 'Invalid date format' });
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Sanitize and normalize ticket data
 * @param {Object} row - Row data from CSV/Excel
 * @returns {Object} - Normalized ticket data
 */
export const normalizeTicketData = (row) => {
    return {
        subject: row.Subject?.trim(),
        description: row.Description?.trim(),
        priority: row.Priority?.toLowerCase() || 'medium',
        status: row.Status?.toLowerCase() || 'open',
        channel: row.Channel?.toLowerCase() || 'web',
        contactName: row['Contact Name']?.trim(),
        contactEmail: row['Contact Email']?.trim(),
        contactPhone: row['Contact Phone']?.trim(),
        accountName: row['Account Name']?.trim(),
        departmentName: row.Department?.trim(),
        productName: row.Product?.trim(),
        assignedAgentEmail: row['Assigned Agent Email']?.trim(),
        teamName: row.Team?.trim(),
        dueDate: row['Due Date'] ? new Date(row['Due Date']) : null,
        classification: row.Classification?.trim(),
        language: row.Language?.trim(),
        tags: row.Tags ? row.Tags.split(',').map(t => t.trim()) : []
    };
};
