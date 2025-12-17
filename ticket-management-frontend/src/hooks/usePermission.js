import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../config/permissions';

export const usePermission = (permissionId) => {
    const { checkPermission, loading } = useAuth();

    const hasPermission = checkPermission(permissionId);

    return { hasPermission, loading };
};

export const usePermissions = () => {
    const { permissions, checkPermission, loading } = useAuth();

    return { permissions, checkPermission, loading };
};

export { PERMISSIONS };
