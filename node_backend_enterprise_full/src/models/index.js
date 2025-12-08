// Export all models for easy importing
export { default as User } from './User.js';
export { default as Account } from './Account.js';
export { default as Contact } from './Contact.js';
export { default as Agent } from './Agent.js';
export { default as Role } from './Role.js';
export { default as Permission } from './Permission.js';
export { default as Team } from './Team.js';
export { default as SlaRule } from './SlaRule.js';
export { default as Ticket } from './Ticket.js';
export { default as TicketComment } from './TicketComment.js';
export { default as TicketHistory } from './TicketHistory.js';
export { default as TicketAttachment } from './TicketAttachment.js';
export { default as Tag } from './Tag.js';

// Model relationships and population helpers
export const populateTicket = {
  path: 'contactId accountId assignedAgentId teamId slaId tags createdBy assignedTo',
  populate: [
    { path: 'contactId', select: 'fullName email phoneNumber' },
    { path: 'accountId', select: 'accountName website' },
    { path: 'assignedAgentId', select: 'fullName email status' },
    { path: 'teamId', select: 'teamName' },
    { path: 'slaId', select: 'name firstResponseTimeMinutes resolutionTimeMinutes' },
    { path: 'tags', select: 'tagName color' },
    { path: 'createdBy', select: 'name email role' },
    { path: 'assignedTo', select: 'name email role' }
  ]
};

export const populateTicketComments = {
  path: 'ticketId',
  populate: {
    path: 'author',
    select: 'fullName email name'
  }
};

export const populateAgent = {
  path: 'roleId teamId',
  populate: [
    { path: 'roleId', select: 'roleName permissions' },
    { path: 'teamId', select: 'teamName departmentHeadId' }
  ]
};