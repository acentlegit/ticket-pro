import React from 'react';
import { usePermission } from '../hooks/usePermission';

/**
 * PermissionGuard component
 * Renders children only if user has the required permission
 * 
 * @param {Object} props
 * @param {string} props.permission - Permission ID to check
 * @param {React.ReactNode} props.children - Content to render if permitted
 * @param {React.ReactNode} props.fallback - Content to render if not permitted (optional)
 */
const PermissionGuard = ({ permission, children, fallback = null }) => {
    const { hasPermission, loading } = usePermission(permission);

    if (loading) {
        // You might want to render a skeleton or nothing while loading
        return null;
    }

    if (!hasPermission) {
        return fallback;
    }

    return <>{children}</>;
};

export default PermissionGuard;
