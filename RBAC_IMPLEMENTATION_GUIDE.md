# RBAC (Role-Based Access Control) Implementation Guide

## Overview

This document describes the complete Role-Based Access Control (RBAC) system implemented for the Ticket Management application. The system provides granular permission control across 5 user roles with 20 specific permissions.

---

## Table of Contents

1. [Roles](#roles)
2. [Permissions](#permissions)
3. [Permission Matrix](#permission-matrix)
4. [Implementation Files](#implementation-files)
5. [Usage Examples](#usage-examples)
6. [API Endpoints](#api-endpoints)
7. [Frontend Integration](#frontend-integration)

---

## Roles

The system supports 5 hierarchical roles:

| Role | Value | Description | Scope |
|------|-------|-------------|-------|
| **Super Admin** | `admin` | Highest level access | All tenants (global) |
| **Company Admin** | `supervisor` | Company-wide management | Single company |
| **Department Admin** | `department_admin` | Department management | Single department |
| **Agent** | `agent` | Ticket handling | Assigned tickets + department |
| **Requester** | `customer` | Ticket creation | Own tickets only |

---

## Permissions

### Permission Categories

1. **Ticket Operations** (CRUD)
2. **Ticket Viewing** (Scope-based)
3. **Ticket Management** (Assignment, Escalation)
4. **System Configuration** (SLA, Routing, Templates)
5. **Analytics & Reporting**
6. **Deletion Operations**

### All Permissions

| Permission ID | Name | Description |
|---------------|------|-------------|
| `TCKT_CREATE` | Create Ticket | Create a new ticket |
| `TCKT_UPDATE` | Update Ticket | Update status, priority, fields |
| `TCKT_COMMENT` | Comment on Ticket | Add comments to ticket |
| `TCKT_CLOSE` | Close Ticket | Close resolved tickets |
| `TCKT_REOPEN` | Reopen Ticket | Reopen closed tickets |
| `TCKT_VIEW_ALL` | View All Tickets | View all tickets across scope |
| `TCKT_VIEW_DEPT` | View Department Tickets | View tickets within department |
| `TCKT_VIEW_ASSIGNED` | View Assigned Tickets | View only assigned tickets |
| `TCKT_VIEW_OWN` | View Own Tickets | View tickets created by self |
| `TCKT_ASSIGN` | Assign Ticket | Assign or reassign tickets |
| `TCKT_ESCALATE` | Escalate Ticket | Escalate ticket manually |
| `SLA_CONFIG` | Configure SLA | Create or edit SLA rules |
| `ROUTE_CONFIG` | Configure Routing | Configure auto-routing rules |
| `TEMPLATE_MANAGE` | Manage Templates | Create/edit ticket templates |
| `CANNED_MANAGE` | Manage Canned Responses | Create/edit canned responses |
| `ANALYTICS_VIEW` | View Analytics | View dashboards and metrics |
| `EXPORT_DATA` | Export Tickets | Export ticket data |
| `AUDIT_VIEW` | View Audit Logs | View ticket audit logs |
| `TCKT_DELETE_SOFT` | Soft Delete Ticket | Soft delete ticket |
| `TCKT_DELETE_HARD` | Hard Delete Ticket | Permanently delete ticket |

---

## Permission Matrix

### Complete Role-Permission Mapping

| Permission | Super Admin | Company Admin | Dept Admin | Agent | Requester |
|------------|:-----------:|:-------------:|:----------:|:-----:|:---------:|
| TCKT_CREATE | ✅ | ✅ | ✅ | ✅ | ✅ |
| TCKT_VIEW_ALL | ✅ | ✅ | ❌ | ❌ | ❌ |
| TCKT_VIEW_DEPT | ✅ | ✅ | ✅ | ✅ | ❌ |
| TCKT_VIEW_ASSIGNED | ✅ | ✅ | ✅ | ✅ | ❌ |
| TCKT_VIEW_OWN | ✅ | ✅ | ✅ | ✅ | ✅ |
| TCKT_UPDATE | ✅ | ✅ | ✅ | ✅ | ❌ |
| TCKT_COMMENT | ✅ | ✅ | ✅ | ✅ | ✅ |
| TCKT_CLOSE | ✅ | ✅ | ✅ | ✅ | ❌ |
| TCKT_REOPEN | ✅ | ✅ | ✅ | Limited | SLA-bound |
| TCKT_ASSIGN | ✅ | ✅ | ✅ | ❌ | ❌ |
| TCKT_ESCALATE | ✅ | ✅ | ✅ | ✅ | ❌ |
| SLA_CONFIG | ✅ | ✅ | ❌ | ❌ | ❌ |
| ROUTE_CONFIG | ✅ | ✅ | ❌ | ❌ | ❌ |
| TEMPLATE_MANAGE | ✅ | ✅ | ❌ | ❌ | ❌ |
| CANNED_MANAGE | ✅ | ✅ | ✅ | ❌ | ❌ |
| ANALYTICS_VIEW | ✅ | ✅ | ✅ | Personal | ❌ |
| EXPORT_DATA | ✅ | ✅ | ❌ | ❌ | ❌ |
| AUDIT_VIEW | ✅ | ✅ | ❌ | ❌ | ❌ |
| TCKT_DELETE_SOFT | ✅ | ✅ | ❌ | ❌ | ❌ |
| TCKT_DELETE_HARD | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Implementation Files

### 1. Permission Definitions
**File:** `src/config/permissions.js`

Defines all permissions, roles, and mappings.

```javascript
import { PERMISSIONS, ROLES, hasPermission } from '../config/permissions.js';

// Check if user has permission
const canCreate = hasPermission(user.role, 'TCKT_CREATE');
```

### 2. Permission Middleware
**File:** `src/middleware/permissions.js`

Provides middleware for route protection.

```javascript
import { requirePermission, requireRole } from '../middleware/permissions.js';

// Protect route with permission
router.delete('/tickets/:id', 
  authenticateToken,
  requirePermission('TCKT_DELETE_SOFT'),
  deleteTicket
);

// Protect route with role
router.get('/admin/settings',
  authenticateToken,
  requireRole(['admin', 'supervisor']),
  getSettings
);
```

### 3. Data Filtering Utilities
**File:** `src/utils/dataFilters.js`

Filters data based on user role and scope.

```javascript
import { getTicketFilter, getAnalyticsFilter } from '../utils/dataFilters.js';

// Get tickets based on user role
const filter = getTicketFilter(req.user, { status: 'open' });
const tickets = await Ticket.find(filter);
```

### 4. Permissions API
**File:** `src/routes/permissions.js`

API endpoints for permission management.

---

## Usage Examples

### Backend - Route Protection

#### Example 1: Simple Permission Check
```javascript
import { requirePermission } from '../middleware/permissions.js';

router.post('/tickets',
  authenticateToken,
  requirePermission('TCKT_CREATE'),
  createTicket
);
```

#### Example 2: Multiple Permission Check (ANY)
```javascript
import { requireAnyPermission } from '../middleware/permissions.js';

router.get('/tickets',
  authenticateToken,
  requireAnyPermission(['TCKT_VIEW_ALL', 'TCKT_VIEW_DEPT', 'TCKT_VIEW_OWN']),
  getTickets
);
```

#### Example 3: Role-Based Access
```javascript
import { requireRole } from '../middleware/permissions.js';

router.post('/sla/config',
  authenticateToken,
  requireRole(['admin', 'supervisor']),
  configureSLA
);
```

#### Example 4: Ticket-Specific Permission
```javascript
import { loadTicket, canUpdateTicketMiddleware } from '../middleware/permissions.js';
import Ticket from '../models/Ticket.js';

router.put('/tickets/:id',
  authenticateToken,
  loadTicket(Ticket),
  canUpdateTicketMiddleware(),
  updateTicket
);
```

### Backend - Data Filtering

#### Example 1: Filter Tickets by Role
```javascript
import { getTicketFilter } from '../utils/dataFilters.js';

const getTickets = async (req, res) => {
  try {
    // Automatically filter based on user role
    const filter = getTicketFilter(req.user, { 
      status: req.query.status 
    });
    
    const tickets = await Ticket.find(filter)
      .populate('assignedAgentId')
      .sort({ createdAt: -1 });
    
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

#### Example 2: Filter Analytics
```javascript
import { getAnalyticsFilter } from '../utils/dataFilters.js';

const getAnalytics = async (req, res) => {
  try {
    const filter = getAnalyticsFilter(req.user);
    
    const stats = await Ticket.aggregate([
      { $match: filter },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);
    
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

#### Example 3: Filter Users
```javascript
import { getUserFilter } from '../utils/dataFilters.js';

const getUsers = async (req, res) => {
  try {
    const filter = getUserFilter(req.user);
    const users = await User.find(filter);
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Backend - Permission Checking in Code

```javascript
import { hasPermission, canViewTicket } from '../config/permissions.js';

const someFunction = async (req, res) => {
  // Check if user has permission
  if (!hasPermission(req.user.role, 'TCKT_ASSIGN')) {
    return res.status(403).json({ message: 'Cannot assign tickets' });
  }
  
  // Check if user can view specific ticket
  const ticket = await Ticket.findById(ticketId);
  if (!canViewTicket(req.user, ticket)) {
    return res.status(403).json({ message: 'Cannot view this ticket' });
  }
  
  // Proceed with operation
  // ...
};
```

---

## API Endpoints

### Permission Management APIs

All endpoints require authentication.

#### 1. Get All Permissions
```http
GET /api/permissions
```

**Response:**
```json
{
  "success": true,
  "count": 20,
  "permissions": [
    {
      "id": "TCKT_CREATE",
      "name": "Create Ticket",
      "description": "Create a new ticket",
      "category": "ticket_crud"
    },
    ...
  ]
}
```

#### 2. Get Permissions by Category
```http
GET /api/permissions/categories
```

**Response:**
```json
{
  "success": true,
  "categories": {
    "ticket_crud": "Ticket Operations",
    "ticket_view": "Ticket Viewing",
    ...
  },
  "permissions": {
    "ticket_crud": [...],
    "ticket_view": [...],
    ...
  }
}
```

#### 3. Get My Permissions
```http
GET /api/permissions/my-permissions
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "agent"
  },
  "count": 10,
  "permissionIds": ["TCKT_CREATE", "TCKT_UPDATE", ...],
  "permissions": [...]
}
```

#### 4. Check Permission
```http
POST /api/permissions/check
Content-Type: application/json

{
  "permission": "TCKT_CREATE"
}
```

**Response:**
```json
{
  "success": true,
  "permission": "TCKT_CREATE",
  "hasPermission": true
}
```

#### 5. Check Multiple Permissions
```http
POST /api/permissions/check
Content-Type: application/json

{
  "permissions": ["TCKT_CREATE", "TCKT_DELETE_HARD"]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    { "permission": "TCKT_CREATE", "hasPermission": true },
    { "permission": "TCKT_DELETE_HARD", "hasPermission": false }
  ],
  "hasAll": false,
  "hasAny": true
}
```

#### 6. Get Role Permissions
```http
GET /api/permissions/role/agent
```

**Response:**
```json
{
  "success": true,
  "role": "agent",
  "count": 10,
  "permissionIds": [...],
  "permissions": [...]
}
```

#### 7. Get Permission Matrix (Admin Only)
```http
GET /api/permissions/matrix
```

**Response:**
```json
{
  "success": true,
  "matrix": [
    {
      "role": "admin",
      "permissionCount": 20,
      "permissions": [...]
    },
    ...
  ]
}
```

---

## Frontend Integration

### 1. Check Permission in React

```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';

const usePermission = (permissionId) => {
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

// Usage
const MyComponent = () => {
  const { hasPermission, loading } = usePermission('TCKT_DELETE_SOFT');

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {hasPermission && (
        <button onClick={handleDelete}>Delete Ticket</button>
      )}
    </div>
  );
};
```

### 2. Conditional Rendering Based on Role

```javascript
import { useAuth } from '../contexts/AuthContext';

const TicketActions = ({ ticket }) => {
  const { user } = useAuth();

  return (
    <div>
      {/* Everyone can comment */}
      <button onClick={handleComment}>Add Comment</button>

      {/* Only agents and above can update */}
      {['agent', 'department_admin', 'supervisor', 'admin'].includes(user.role) && (
        <button onClick={handleUpdate}>Update Ticket</button>
      )}

      {/* Only admins can delete */}
      {['admin', 'supervisor'].includes(user.role) && (
        <button onClick={handleDelete}>Delete Ticket</button>
      )}
    </div>
  );
};
```

### 3. Permission-Based Navigation

```javascript
const Navigation = () => {
  const { user } = useAuth();

  return (
    <nav>
      <Link to="/tickets">Tickets</Link>
      
      {['admin', 'supervisor', 'department_admin'].includes(user.role) && (
        <Link to="/analytics">Analytics</Link>
      )}
      
      {['admin', 'supervisor'].includes(user.role) && (
        <>
          <Link to="/users">User Management</Link>
          <Link to="/settings">Settings</Link>
        </>
      )}
      
      {user.role === 'admin' && (
        <Link to="/admin">Admin Panel</Link>
      )}
    </nav>
  );
};
```

---

## Server Integration

### Add to your main server file:

```javascript
import permissionsRoutes from './routes/permissions.js';

// Add permissions routes
app.use('/api', permissionsRoutes);
```

---

## Testing

### Test Permission Checks

```javascript
import { hasPermission, canViewTicket } from '../config/permissions.js';

describe('Permission System', () => {
  it('should allow admin to delete tickets', () => {
    expect(hasPermission('admin', 'TCKT_DELETE_HARD')).toBe(true);
  });

  it('should not allow agent to delete tickets', () => {
    expect(hasPermission('agent', 'TCKT_DELETE_HARD')).toBe(false);
  });

  it('should allow requester to view own tickets', () => {
    const user = { role: 'customer', _id: 'user1' };
    const ticket = { createdBy: 'user1' };
    expect(canViewTicket(user, ticket)).toBe(true);
  });
});
```

---

## Security Best Practices

1. **Always check permissions on the backend** - Never rely solely on frontend checks
2. **Use middleware consistently** - Apply permission checks to all protected routes
3. **Filter data by role** - Always filter queries based on user scope
4. **Log permission denials** - Track unauthorized access attempts
5. **Regular audits** - Review permission assignments periodically
6. **Principle of least privilege** - Grant minimum necessary permissions

---

## Troubleshooting

### Common Issues

1. **403 Permission Denied**
   - Check if user role is correct
   - Verify permission is assigned to role
   - Ensure user is authenticated

2. **Empty Data Sets**
   - Check if data filtering is too restrictive
   - Verify user has correct companyId/departmentId

3. **Middleware Not Working**
   - Ensure middleware is applied in correct order
   - Check if authenticateToken runs before permission checks

---

## Summary

✅ **5 Roles** with hierarchical access  
✅ **20 Granular Permissions** for fine-grained control  
✅ **Scope-Based Filtering** (tenant → company → department → user)  
✅ **Middleware Protection** for routes  
✅ **Data Filtering Utilities** for queries  
✅ **Permission Management API** for runtime checks  
✅ **Frontend Integration** examples  

The RBAC system is production-ready and follows enterprise security best practices!
