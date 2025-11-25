# Database Schema Documentation

## Overview

This document describes the comprehensive database schema for the Enterprise Ticket Management System, implemented using MongoDB with Mongoose ODM. The schema is based on the provided SQL structure but adapted for MongoDB's document-based approach.

## Models and Relationships

### Core Models

#### 1. **Account** (`accounts`)
Represents customer organizations or companies.

```javascript
{
  accountName: String (required),
  address: String,
  domain: String,
  isActive: Boolean (default: true)
}
```

**Relationships:**
- One-to-Many with `Contact`
- One-to-Many with `Ticket`

#### 2. **Contact** (`contacts`)
Individual users associated with accounts who can create tickets.

```javascript
{
  fullName: String (required),
  email: String (unique, sparse),
  phoneNumber: String,
  accountId: ObjectId (ref: Account),
  isActive: Boolean (default: true)
}
```

**Relationships:**
- Many-to-One with `Account`
- One-to-Many with `Ticket`

#### 3. **Role** (`roles`)
Defines user roles and their permissions.

```javascript
{
  roleName: String (required, unique),
  description: String,
  permissions: [ObjectId] (ref: Permission),
  isActive: Boolean (default: true)
}
```

**Relationships:**
- Many-to-Many with `Permission`
- One-to-Many with `Agent`

#### 4. **Permission** (`permissions`)
Individual permissions that can be assigned to roles.

```javascript
{
  permissionKey: String (required, unique),
  description: String,
  module: String (enum: tickets, users, accounts, reports, settings, admin),
  action: String (enum: create, read, update, delete, manage)
}
```

**Relationships:**
- Many-to-Many with `Role`

#### 5. **Team** (`teams`)
Groups of agents working together.

```javascript
{
  teamName: String (required),
  departmentHeadId: ObjectId (ref: Agent),
  description: String,
  isActive: Boolean (default: true)
}
```

**Relationships:**
- One-to-Many with `Agent`
- One-to-Many with `Ticket`

#### 6. **Agent** (`agents`)
Internal users who handle tickets.

```javascript
{
  fullName: String (required),
  email: String (required, unique),
  password: String (required),
  roleId: ObjectId (ref: Role, required),
  teamId: ObjectId (ref: Team),
  status: String (enum: active, inactive, suspended),
  lastLogin: Date,
  avatar: String,
  phoneNumber: String
}
```

**Relationships:**
- Many-to-One with `Role`
- Many-to-One with `Team`
- One-to-Many with `Ticket` (as assignedAgentId)

#### 7. **SlaRule** (`sla_rules`)
Service Level Agreement rules for ticket handling.

```javascript
{
  name: String (required),
  firstResponseTimeMinutes: Number (required),
  resolutionTimeMinutes: Number (required),
  priority: String (enum: low, medium, high, urgent),
  conditions: {
    ticketType: [String],
    priority: [String],
    channel: [String]
  },
  isActive: Boolean (default: true)
}
```

**Relationships:**
- One-to-Many with `Ticket`

#### 8. **Tag** (`tags`)
Labels for categorizing tickets.

```javascript
{
  tagName: String (required, unique),
  color: String (hex color, default: #3B82F6),
  description: String,
  isActive: Boolean (default: true)
}
```

**Relationships:**
- Many-to-Many with `Ticket`

### Ticket-Related Models

#### 9. **Ticket** (`tickets`)
Main ticket entity with comprehensive tracking.

```javascript
{
  subject: String (required),
  description: String (required),
  contactId: ObjectId (ref: Contact),
  accountId: ObjectId (ref: Account),
  assignedAgentId: ObjectId (ref: Agent),
  teamId: ObjectId (ref: Team),
  channel: String (enum: email, phone, chat, web, social, api),
  priority: String (enum: low, medium, high, urgent),
  status: String (enum: open, in-progress, pending, resolved, closed),
  slaId: ObjectId (ref: SlaRule),
  dueDate: Date,
  customerRespondedTime: Date,
  agentRespondedTime: Date,
  resolvedAt: Date,
  closedAt: Date,
  tags: [ObjectId] (ref: Tag),
  
  // Legacy fields for backward compatibility
  createdBy: ObjectId (ref: User),
  assignedTo: ObjectId (ref: User),
  category: String,
  slaStatus: String (enum: within-sla, approaching-breach, breached)
}
```

**Relationships:**
- Many-to-One with `Contact`
- Many-to-One with `Account`
- Many-to-One with `Agent`
- Many-to-One with `Team`
- Many-to-One with `SlaRule`
- Many-to-Many with `Tag`
- One-to-Many with `TicketComment`
- One-to-Many with `TicketHistory`
- One-to-Many with `TicketAttachment`

#### 10. **TicketComment** (`ticket_comments`)
Comments and communications on tickets.

```javascript
{
  ticketId: ObjectId (ref: Ticket, required),
  authorType: String (enum: agent, contact, system),
  authorId: ObjectId (required),
  commentText: String (required),
  isInternal: Boolean (default: false),
  attachments: [{
    fileName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String
  }],
  editedAt: Date,
  editedBy: ObjectId
}
```

**Relationships:**
- Many-to-One with `Ticket`
- Polymorphic relationship with `Agent` or `Contact` (via authorType/authorId)

#### 11. **TicketHistory** (`ticket_history`)
Audit trail of ticket changes.

```javascript
{
  ticketId: ObjectId (ref: Ticket, required),
  fieldChanged: String (required),
  oldValue: Mixed,
  newValue: Mixed,
  changedBy: ObjectId (required),
  changedByType: String (enum: agent, contact, system),
  changeType: String (enum: create, update, delete, assign, status_change, priority_change),
  changedAt: Date (default: now)
}
```

**Relationships:**
- Many-to-One with `Ticket`
- Polymorphic relationship with `Agent` or `Contact` (via changedByType/changedBy)

#### 12. **TicketAttachment** (`ticket_attachments`)
File attachments associated with tickets.

```javascript
{
  ticketId: ObjectId (ref: Ticket, required),
  fileName: String (required),
  originalName: String (required),
  filePath: String (required),
  fileSize: Number (required),
  mimeType: String (required),
  uploadedBy: ObjectId (required),
  uploadedByType: String (enum: agent, contact),
  uploadedAt: Date (default: now),
  isPublic: Boolean (default: false),
  downloadCount: Number (default: 0)
}
```

**Relationships:**
- Many-to-One with `Ticket`
- Polymorphic relationship with `Agent` or `Contact` (via uploadedByType/uploadedBy)

### Legacy Model

#### 13. **User** (`users`)
Legacy user model maintained for backward compatibility.

```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required),
  role: String (enum: admin, supervisor, agent, customer),
  isActive: Boolean (default: true),
  lastLogin: Date
}
```

## Key Features

### 1. **Polymorphic Relationships**
Several models use polymorphic relationships to reference different types of users:
- `TicketComment.authorType/authorId`
- `TicketHistory.changedByType/changedBy`
- `TicketAttachment.uploadedByType/uploadedBy`

### 2. **Comprehensive Indexing**
All models include strategic indexes for:
- Primary lookups (email, name, etc.)
- Foreign key relationships
- Common query patterns
- Compound indexes for complex queries

### 3. **Virtual Properties**
Models include virtual properties for:
- Calculated fields (age, formatted sizes, etc.)
- Related document counts
- Populated relationships

### 4. **Middleware Hooks**
Pre-save middleware for:
- Automatic timestamp updates
- Status change tracking
- Data validation

### 5. **Data Seeding**
Comprehensive seeding system for:
- Permissions and roles
- Teams and SLA rules
- Sample accounts and tags
- Initial admin users

## Population Helpers

The system includes predefined population configurations:

```javascript
// Full ticket population
populateTicket: {
  path: 'contactId accountId assignedAgentId teamId slaId tags createdBy assignedTo',
  populate: [...]
}

// Comment population
populateTicketComments: {
  path: 'ticketId',
  populate: { path: 'author', select: 'fullName email name' }
}

// Agent population
populateAgent: {
  path: 'roleId teamId',
  populate: [...]
}
```

## Migration Strategy

The schema maintains backward compatibility with the existing system:
1. Legacy `User` model is preserved
2. New `Agent` model provides enhanced functionality
3. Tickets can reference both old and new user systems
4. Gradual migration path available

## Usage Examples

### Creating a Ticket with Full Relationships
```javascript
const ticket = new Ticket({
  subject: 'Login Issue',
  description: 'Cannot access account',
  contactId: contactId,
  accountId: accountId,
  assignedAgentId: agentId,
  teamId: teamId,
  priority: 'high',
  channel: 'email',
  tags: [bugTagId, urgentTagId]
});
```

### Querying with Population
```javascript
const tickets = await Ticket.find()
  .populate('contactId', 'fullName email')
  .populate('assignedAgentId', 'fullName email')
  .populate('tags', 'tagName color');
```

This schema provides a robust foundation for enterprise ticket management with comprehensive tracking, audit trails, and flexible relationships.