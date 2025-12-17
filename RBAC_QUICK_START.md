# RBAC Quick Start Guide

## 🚀 Getting Started with RBAC

This guide will help you quickly integrate the RBAC system into your application.

---

## Step 1: Register the Permissions Routes

Add the permissions routes to your main server file.

**File:** `src/server.js` or `src/index.js`

```javascript
import permissionsRoutes from './routes/permissions.js';

// Add after other routes
app.use('/api', permissionsRoutes);
```

---

## Step 2: Protect Your Routes

### Example: Protect Ticket Routes

**File:** `src/routes/tickets.js`

```javascript
import express from 'express';
import { 
  requirePermission, 
  loadTicket,
  canViewTicketMiddleware,
  canUpdateTicketMiddleware 
} from '../middleware/permissions.js';
import Ticket from '../models/Ticket.js';

const router = express.Router();

// Create ticket - everyone can create
router.post('/tickets',
  authenticateToken,
  requirePermission('TCKT_CREATE'),
  createTicket
);

// View ticket - check if user can view this specific ticket
router.get('/tickets/:id',
  authenticateToken,
  loadTicket(Ticket),
  canViewTicketMiddleware(),
  getTicket
);

// Update ticket - check if user can update this specific ticket
router.put('/tickets/:id',
  authenticateToken,
  loadTicket(Ticket),
  canUpdateTicketMiddleware(),
  updateTicket
);

// Delete ticket - only admins
router.delete('/tickets/:id',
  authenticateToken,
  requirePermission('TCKT_DELETE_SOFT'),
  deleteTicket
);

export default router;
```

---

## Step 3: Filter Data by Role

### Example: Get Tickets with Role-Based Filtering

**File:** `src/routes/tickets.js`

```javascript
import { getTicketFilter, applyPagination, getPaginationMeta } from '../utils/dataFilters.js';

const getTickets = async (req, res) => {
  try {
    // Build filter based on user role
    const baseFilter = getTicketFilter(req.user);
    
    // Add additional filters from query
    const filter = {
      ...baseFilter,
      ...(req.query.status && { status: req.query.status }),
      ...(req.query.priority && { priority: req.query.priority })
    };

    // Get total count
    const total = await Ticket.countDocuments(filter);

    // Apply pagination
    let query = Ticket.find(filter)
      .populate('assignedAgentId', 'fullName email')
      .populate('createdBy', 'fullName email');

    query = applyPagination(query, {
      page: req.query.page,
      limit: req.query.limit,
      sort: { createdAt: -1 }
    });

    const tickets = await query;

    res.json({
      success: true,
      tickets,
      pagination: getPaginationMeta(total, req.query.page, req.query.limit)
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message 
    });
  }
};
```

---

## Step 4: Check Permissions in Controller Logic

### Example: Assign Ticket

```javascript
import { canAssignTicket } from '../config/permissions.js';

const assignTicket = async (req, res) => {
  try {
    const { ticketId, agentId } = req.body;
    
    // Load ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user can assign this ticket
    if (!canAssignTicket(req.user, ticket)) {
      return res.status(403).json({ 
        message: 'You do not have permission to assign this ticket' 
      });
    }

    // Assign ticket
    ticket.assignedAgentId = agentId;
    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      ticket
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## Step 5: Frontend Integration

### Create a Permission Hook

**File:** `src/hooks/usePermission.js`

```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';

export const usePermission = (permissionId) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await api.post('/permissions/check', {
          permission: permissionId
        });
        setHasPermission(response.data.hasPermission);
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [permissionId]);

  return { hasPermission, loading };
};

export const usePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await api.get('/permissions/my-permissions');
        setPermissions(response.data.permissionIds);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasPermission = (permissionId) => {
    return permissions.includes(permissionId);
  };

  return { permissions, hasPermission, loading };
};
```

### Use in Components

```javascript
import { usePermission } from '../hooks/usePermission';

const TicketActions = ({ ticket }) => {
  const { hasPermission: canDelete } = usePermission('TCKT_DELETE_SOFT');
  const { hasPermission: canAssign } = usePermission('TCKT_ASSIGN');

  return (
    <div className="ticket-actions">
      {canAssign && (
        <button onClick={() => handleAssign(ticket)}>
          Assign Ticket
        </button>
      )}
      
      {canDelete && (
        <button onClick={() => handleDelete(ticket)}>
          Delete Ticket
        </button>
      )}
    </div>
  );
};
```

---

## Common Use Cases

### 1. Protect Admin Routes

```javascript
import { requireRole } from '../middleware/permissions.js';

router.get('/admin/settings',
  authenticateToken,
  requireRole(['admin', 'supervisor']),
  getAdminSettings
);
```

### 2. Check Multiple Permissions (ANY)

```javascript
import { requireAnyPermission } from '../middleware/permissions.js';

router.get('/tickets',
  authenticateToken,
  requireAnyPermission(['TCKT_VIEW_ALL', 'TCKT_VIEW_DEPT', 'TCKT_VIEW_OWN']),
  getTickets
);
```

### 3. Check Multiple Permissions (ALL)

```javascript
import { requireAllPermissions } from '../middleware/permissions.js';

router.post('/tickets/bulk-assign',
  authenticateToken,
  requireAllPermissions(['TCKT_VIEW_ALL', 'TCKT_ASSIGN']),
  bulkAssignTickets
);
```

### 4. Company Scope Check

```javascript
import { requireCompanyScope } from '../middleware/permissions.js';

router.get('/company/:companyId/stats',
  authenticateToken,
  loadCompany,
  requireCompanyScope(),
  getCompanyStats
);
```

### 5. Department Scope Check

```javascript
import { requireDepartmentScope } from '../middleware/permissions.js';

router.get('/department/:deptId/tickets',
  authenticateToken,
  loadDepartment,
  requireDepartmentScope(),
  getDepartmentTickets
);
```

---

## Testing Your Implementation

### 1. Test Permission Check API

```bash
# Get your permissions
curl -X GET http://localhost:4000/api/permissions/my-permissions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check specific permission
curl -X POST http://localhost:4000/api/permissions/check \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permission": "TCKT_CREATE"}'
```

### 2. Test Protected Route

```bash
# Try to delete ticket (should fail for non-admins)
curl -X DELETE http://localhost:4000/api/tickets/TICKET_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Data Filtering

```bash
# Get tickets (should return filtered based on role)
curl -X GET http://localhost:4000/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### Issue: 403 Permission Denied

**Check:**
1. User role is correct in database
2. Permission is assigned to the role in `permissions.js`
3. Middleware is applied in correct order

### Issue: Empty Results

**Check:**
1. User has `companyId` and `departmentId` set
2. Data filtering is not too restrictive
3. Test with Super Admin role to verify data exists

### Issue: Middleware Not Working

**Check:**
1. `authenticateToken` runs before permission middleware
2. Middleware is imported correctly
3. Routes are registered in server

---

## Next Steps

1. ✅ Add permission routes to server
2. ✅ Protect your existing routes
3. ✅ Add data filtering to queries
4. ✅ Integrate frontend permission checks
5. ✅ Test with different user roles
6. ✅ Review and adjust permissions as needed

---

## Quick Reference

### Import Statements

```javascript
// Permissions config
import { PERMISSIONS, ROLES, hasPermission } from '../config/permissions.js';

// Middleware
import { 
  requirePermission, 
  requireRole,
  requireAnyPermission,
  requireAllPermissions,
  loadTicket,
  canViewTicketMiddleware,
  canUpdateTicketMiddleware,
  canAssignTicketMiddleware
} from '../middleware/permissions.js';

// Data filters
import { 
  getTicketFilter,
  getAnalyticsFilter,
  getUserFilter,
  applyPagination,
  getPaginationMeta
} from '../utils/dataFilters.js';
```

### Permission IDs

```javascript
// Ticket Operations
'TCKT_CREATE', 'TCKT_UPDATE', 'TCKT_COMMENT', 'TCKT_CLOSE', 'TCKT_REOPEN'

// Ticket Viewing
'TCKT_VIEW_ALL', 'TCKT_VIEW_DEPT', 'TCKT_VIEW_ASSIGNED', 'TCKT_VIEW_OWN'

// Management
'TCKT_ASSIGN', 'TCKT_ESCALATE'

// Configuration
'SLA_CONFIG', 'ROUTE_CONFIG', 'TEMPLATE_MANAGE', 'CANNED_MANAGE'

// Analytics
'ANALYTICS_VIEW', 'EXPORT_DATA', 'AUDIT_VIEW'

// Deletion
'TCKT_DELETE_SOFT', 'TCKT_DELETE_HARD'
```

### Role Values

```javascript
'admin'              // Super Admin
'supervisor'         // Company Admin
'department_admin'   // Department Admin
'agent'              // Agent
'customer'           // Requester
```

---

## Support

For detailed documentation, see `RBAC_IMPLEMENTATION_GUIDE.md`

For permission matrix, see the main implementation guide.

---

**You're all set! 🎉**

The RBAC system is now ready to use. Start protecting your routes and filtering your data!
