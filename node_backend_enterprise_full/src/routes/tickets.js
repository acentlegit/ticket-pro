
import express from 'express';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Contact from '../models/Contact.js';
import Agent from '../models/Agent.js';
import Team from '../models/Team.js';
import TicketHistory from '../models/TicketHistory.js';
import jwt from 'jsonwebtoken';
import Product from '../models/Product.js';
import Account from '../models/Account.js';
import mongoose from 'mongoose';
import SlaRule from '../models/SlaRule.js';
import Tag from '../models/Tag.js';
import { bulkUpload } from '../middleware/bulkUpload.js';
import { parseFile } from '../utils/fileParser.js';
import { validateTicketData, normalizeTicketData } from '../utils/ticketValidator.js';
import Department from '../models/Department.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import TicketComment from '../models/TicketComment.js';
import { upload } from '../middleware/upload.js';
import { canViewTicket, canUpdateTicket, canAssignTicket, PERMISSIONS, ROLES } from '../config/permissions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check user roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Get ticket stats (Must be before /:id route)
router.get('/:companyId/tickets/stats', authenticateToken, requireRole(['admin', 'company_admin', 'department_admin', 'agent']), async (req, res) => {
  try {
    const { companyId } = req.params;
    const user = req.user;

    // Base filter
    const matchStage = { companyId: new mongoose.Types.ObjectId(companyId) };

    // Role-based scoping
    if (user.role === ROLES.DEPARTMENT_ADMIN) {
      if (user.departmentId) matchStage.departmentId = user.departmentId;
    } else if (user.role === ROLES.AGENT) {
      // Agent: Assigned OR Dept
      matchStage.$or = [
        { assignedAgentId: user._id },
        { departmentId: user.departmentId }
      ];
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(todayStart.getDate() + 1);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const facetResult = await Ticket.aggregate([
      { $match: matchStage },
      {
        $facet: {
          statusCounts: [
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ],
          unassigned: [
            { $match: { assignedAgentId: null } },
            { $count: "count" }
          ],
          overdue: [
            {
              $match: {
                dueDate: { $lt: now },
                status: { $nin: ['resolved', 'closed'] }
              }
            },
            { $count: "count" }
          ],
          dueToday: [
            {
              $match: {
                dueDate: { $gte: todayStart, $lt: tomorrowStart }
              }
            },
            { $count: "count" }
          ],
          unassignedDueInHour: [
            {
              $match: {
                assignedAgentId: null,
                dueDate: { $lte: oneHourFromNow }
              }
            },
            { $count: "count" }
          ],
          newTickets: [
            { $match: { createdAt: { $gte: yesterday } } },
            { $count: "count" }
          ]
        }
      }
    ]);

    const r = facetResult[0];
    const getCount = (arr) => arr.length > 0 ? arr[0].count : 0;
    const getStatusCount = (status) => {
      const f = r.statusCounts.find(x => x._id === status);
      return f ? f.count : 0;
    };

    const stats = {
      openTickets: getStatusCount("open"),
      onHoldTickets: getStatusCount("pending"),
      closedTickets: getStatusCount("closed") + getStatusCount("resolved"),
      backlogTickets: getStatusCount("in-progress"),
      unassignedTickets: getCount(r.unassigned),
      overdueTickets: getCount(r.overdue),
      dueToday: getCount(r.dueToday),
      unassignedDueInHour: getCount(r.unassignedDueInHour),
      newTickets: getCount(r.newTickets)
    };

    res.json(stats);
  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({ message: 'Failed to fetch ticket statistics' });
  }
});

// Create ticket
router.post('/:companyId/tickets',
  authenticateToken,
  requireRole(['admin', 'company_admin', 'department_admin', 'agent', 'requester']),
  upload.array('attachments', 10), // Limit to 10 files
  async (req, res) => {
    try {
      const {
        subject,
        description,
        priority,
        channel,
        dueDate,
        departmentId,
        assignedAgentId,
        teamId,
        productId,
        contactName,
        accountNameOrId,
        email,
        phone,
        language,
        classification,
        attachments
      } = req.body;
      const { companyId } = req.params;
      // Validate required fields
      if (!subject || !description) {
        return res.status(400).json({ message: 'Subject and description are required' });
      }

      let account = await Account.findOne({
        $or: [
          { accountName: accountNameOrId },
          { _id: mongoose.Types.ObjectId.isValid(accountNameOrId) ? accountNameOrId : null }
        ]
      });
      // .populate('companyId', 'companyName website');
      if (!account) {
        account = await Account.create({
          accountName: accountNameOrId,
          companyId: companyId || null
        });
      }

      let contact = await Contact.findOne({ email: email });
      // .populate('companyId', 'companyName website');
      if (!contact) {
        contact = await Contact.create({
          firstName: contactName,
          email: email?.trim(),
          phoneNumber: phone?.trim(),
          companyId: companyId || null,
          accountId: account._id || null
        });
      }

      // Find matching SLA rule based on priority
      const slaRule = await SlaRule.findOne({
        priority: priority || 'medium',
        isActive: true
      });

      const ticketData = {
        subject: subject.trim(),
        description: description.trim(),
        priority: priority || 'medium',   // enum: Low, Medium, High, Urgent
        channel: channel || 'web',        // enum: Phone, Email, Chat, Web, Other
        departmentId: departmentId || null,
        contactId: contact?._id || null,
        accountId: account?._id || null,
        productId: productId || null,
        ticketOwner: assignedAgentId || teamId || null,   // one-to-one mapping
        ticketOwnerModel: assignedAgentId ? 'agent' : (teamId ? 'Team' : null),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'open',
        slaId: slaRule?._id || null,
        language: language || null,
        classification: classification || null,
        isActive: true,
        companyId: companyId || null,
        assignedAgentId: assignedAgentId || null,
        teamId: teamId || null,
        createdBy: req.user._id
      };

      // Handle attachments
      if (req.files && req.files.length > 0) {
        const processedAttachments = req.files.map(file => ({
          fileName: file.originalname,
          filePath: `/uploads/tickets/${file.filename}`, // Ensure path matches upload middleware
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedBy: req.user._id
        }));
        ticketData.attachments = processedAttachments;
      } else {
        ticketData.attachments = [];
      }

      // Create the ticket
      const ticket = await Ticket.create(ticketData);
      // Create history entry
      await TicketHistory.create({
        ticketId: ticket._id,
        fieldChanged: 'ticket_created',
        oldValue: null,
        newValue: 'Ticket created',
        changedBy: req.user._id,
        changedByType: 'agent',
        changeType: 'create'
      });

      // Populate the ticket with related data
      const populatedTicket = await Ticket.findById(ticket._id)
        .populate('contactId', 'firstName lastName email phoneNumber')
        .populate('accountId', 'accountName')
        .populate('departmentId', 'departmentName')
        .populate('productId', 'productName')
        .populate('assignedAgentId', 'fullName email')
        .populate('teamId', 'teamName')
        .populate('createdBy', 'fullName email')
        .populate('assignedTo', 'fullName email');

      res.status(201).json({
        message: 'Ticket created successfully',
        ticket: populatedTicket
      });
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({
        message: 'Failed to create ticket',
        error: error.message
      });
    }
  });

// Get all tickets
router.get('/:companyId/tickets', authenticateToken, requireRole(['admin', 'company_admin', 'department_admin', 'agent', 'requester']), async (req, res) => {
  try {
    const { status, priority, assignedTo, page = 1, limit = 50 } = req.query;
    const { companyId } = req.params;

    // Build filter query
    // Build filter query
    const filter = { companyId };

    // Role-based scoping matching Permissions Table
    if (req.user.role === ROLES.DEPARTMENT_ADMIN) {
      filter.departmentId = req.user.departmentId;
    } else if (req.user.role === ROLES.AGENT) {
      // Agent: CreatedBy only (as per latest requirement)
      // filter.$or = [
      //   { assignedAgentId: req.user._id },
      //   { createdBy: req.user._id }
      // ];
      filter.createdBy = req.user._id;
    } else if (req.user.role === ROLES.REQUESTER) {
      // Requester: Own only
      filter.createdBy = req.user._id;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedAgentId = assignedTo;

    const tickets = await Ticket.find(filter)
      .populate('contactId', 'firstName lastName email phoneNumber')
      .populate('accountId', 'accountName')
      .populate('departmentId', 'departmentName')
      .populate('productId', 'productName')
      .populate('assignedAgentId', 'fullName email')
      .populate('teamId', 'teamName')
      .populate('createdBy', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments(filter);

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

// Get single ticket
router.get('/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('contactId', 'firstName lastName email phoneNumber')
      .populate('accountId', 'accountName')
      .populate('departmentId', 'departmentName')
      .populate('productId', 'productName')
      .populate('assignedAgentId', 'fullName email')
      .populate('teamId', 'teamName')
      .populate('createdBy', 'fullName email')
      .populate('assignedTo', 'fullName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user can view this ticket
    // Check if user can view this ticket
    if (!canViewTicket(req.user, ticket)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Failed to fetch ticket' });
  }
});

// Update ticket (PUT - full update)
router.put('/:companyId/tickets/:id', authenticateToken, requireRole(['admin', 'company_admin', 'department_admin', 'agent']), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (!canUpdateTicket(req.user, ticket)) {
      return res.status(403).json({ message: 'Insufficient permissions to update this ticket' });
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('contactId', 'firstName lastName email phoneNumber')
      .populate('accountId', 'accountName')
      .populate('departmentId', 'departmentName')
      .populate('productId', 'productName')
      .populate('assignedAgentId', 'fullName email')
      .populate('teamId', 'teamName')
      .populate('createdBy', 'fullName email')
      .populate('assignedTo', 'fullName email');

    res.json({
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ message: 'Failed to update ticket', error: error.message });
  }
});

// Update ticket (PATCH - partial update)
router.patch('/:companyId/tickets/:id', authenticateToken, requireRole(['admin', 'company_admin', 'department_admin', 'agent', 'requester']), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    const { companyId } = req.params;

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Special case for Requester Reopen
    if (req.user.role === 'requester') {
      const userId = req.user._id.toString();
      // Check ownership (createdBy or contactId)
      // Note: Using toString() safely
      const isOwner = (ticket.createdBy && ticket.createdBy.toString() === userId) ||
        (ticket.contactId && req.user.contactId && ticket.contactId.toString() === req.user.contactId.toString());

      // If ticket.createdBy is populated, toString() returns ID string usually or object string?
      // Mongoose document .toString() returns ID if it's an ID, or "[object Object]" if populated?
      // Wait, earlier I assumed populated returns object.
      // Let's rely on getId helper if I could import it, but I can't easily import non-exported helper.
      // But `ticket` here is NOT populated yet! `Ticket.findById(req.params.id)` (line 313) has NO populate calls attached.
      // So ticket.createdBy is just the ID. Safe.

      // Re-check line 313: `const ticket = await Ticket.findById(req.params.id);` - NO populate.
      // So fields are IDs.

      if (!isOwner && ticket.createdBy?.toString() !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Allowed field: status (only to 'open'/'reopened')
      const allowedUpdates = ['status', 'companyId']; // companyId is in params but might be in body? Body usually has updates.
      // Actually req.body has updates.
      const updates = Object.keys(req.body);
      const restrictedUpdates = updates.filter(u => u !== 'status');

      if (restrictedUpdates.length > 0) {
        return res.status(403).json({ message: 'Customers can only update ticket status (reopen)' });
      }

      if (req.body.status && !['open', 'reopened'].includes(req.body.status)) {
        return res.status(403).json({ message: 'Invalid status update for customer' });
      }
    } else {
      if (!canUpdateTicket(req.user, ticket)) {
        return res.status(403).json({ message: 'Insufficient permissions to update this ticket' });
      }
    }

    // Handle account name update
    if (req.body.accountNameOrId) {
      let account = await Account.findOne({
        $or: [
          { accountName: req.body.accountNameOrId },
          { _id: mongoose.Types.ObjectId.isValid(req.body.accountNameOrId) ? req.body.accountNameOrId : null }
        ]
      });

      if (!account) {
        account = await Account.create({
          accountName: req.body.accountNameOrId,
          companyId: companyId
        });
      }
      req.body.accountId = account._id;
    }

    // Handle contact updates
    if (req.body.contactName || req.body.email || req.body.phone) {
      let contact = await Contact.findOne({ email: req.body.email });

      if (!contact && req.body.email) {
        contact = await Contact.create({
          firstName: req.body.contactName,
          email: req.body.email?.trim(),
          phoneNumber: req.body.phone?.trim(),
          companyId: companyId,
          accountId: req.body.accountId || null
        });
      } else if (contact) {
        await Contact.findByIdAndUpdate(contact._id, {
          firstName: req.body.contactName,
          phoneNumber: req.body.phone?.trim()
        });
      }

      if (contact) {
        req.body.contactId = contact._id;
      }
    }

    // Update assignedTo if assignedAgentId is provided
    if (req.body.assignedAgentId) {
      if (!canAssignTicket(req.user, ticket)) {
        return res.status(403).json({ message: 'Insufficient permissions to assign ticket' });
      }
      req.body.assignedTo = req.body.assignedAgentId;
    }

    // Remove fields that shouldn't be directly updated
    delete req.body.contactName;
    delete req.body.accountNameOrId;
    delete req.body.email;
    delete req.body.phone;

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('contactId', 'firstName lastName email phoneNumber')
      .populate('accountId', 'accountName')
      .populate('departmentId', 'departmentName')
      .populate('productId', 'productName')
      .populate('assignedAgentId', 'fullName email')
      .populate('teamId', 'teamName')
      .populate('createdBy', 'fullName email')
      .populate('assignedTo', 'fullName email');

    res.json({
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ message: 'Failed to update ticket', error: error.message });
  }
});

// Delete ticket (admin only)
router.delete('/:companyId/tickets/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await Ticket.findByIdAndDelete(req.params.id);

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ message: 'Failed to delete ticket' });
  }
});

// Bulk upload tickets
router.post('/:companyId/tickets/bulk-upload',
  authenticateToken,
  requireRole(['admin', 'company_admin', 'agent']),
  bulkUpload.single('file'),
  async (req, res) => {
    const startTime = Date.now();

    try {
      const { companyId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Parse file
      const rows = await parseFile(file.path, file.mimetype);

      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'File is empty or invalid'
        });
      }

      // Limit rows to prevent abuse
      if (rows.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 1000 tickets allowed per upload'
        });
      }

      const results = {
        totalRows: rows.length,
        successCount: 0,
        failureCount: 0,
        createdTickets: [],
        errors: []
      };

      // Cache active SLA rules for performance
      const activeSlaRules = await SlaRule.find({ isActive: true });
      const slaMap = activeSlaRules.reduce((acc, rule) => {
        acc[rule.priority] = rule._id;
        return acc;
      }, {});

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 for header row and 0-index

        // Validate row
        const validation = validateTicketData(row);
        if (!validation.valid) {
          results.failureCount++;
          results.errors.push({
            row: rowNumber,
            data: row,
            errors: validation.errors
          });
          continue;
        }

        try {
          // Normalize data
          const ticketData = normalizeTicketData(row);
          // Find or create account
          let account = null;
          let contact = null;
          if (ticketData.accountName) {
            account = await Account.findOne({
              accountName: ticketData.accountName,
              companyId
            });
            if (!account) {
              account = await Account.create({
                accountName: ticketData.accountName,
                companyId
              });
            }

            // Find or create contact
            if (ticketData.contactEmail) {
              contact = await Contact.findOne({
                email: ticketData.contactEmail,
                companyId
              });

              if (!contact) {
                contact = await Contact.create({
                  firstName: ticketData.contactName || 'Unknown',
                  email: ticketData.contactEmail,
                  phoneNumber: ticketData.contactPhone,
                  accountId: account._id || null,
                  companyId
                });
              }
            }
            // Update contact's account if needed
            // if (contact && !contact.accountId) {
            //   contact.accountId = account._id;
            //   await contact.save();
            // }
          }

          // Find department by name
          let department = null;
          if (ticketData.departmentName) {
            department = await Department.findOne({
              departmentName: ticketData.departmentName,
              companyId
            });
          }

          // Find product by name
          let product = null;
          if (ticketData.productName) {
            product = await Product.findOne({
              productName: ticketData.productName,
              companyId
            });
          }

          // Find assigned agent by email
          let assignedAgent = null;
          if (ticketData.assignedAgentEmail) {
            assignedAgent = await User.findOne({
              email: ticketData.assignedAgentEmail,
              companyId
            });
          }

          // Find team by name
          let team = null;
          if (ticketData.teamName) {
            team = await Team.findOne({
              teamName: ticketData.teamName,
              companyId
            });
          }

          // Create ticket
          const ticket = await Ticket.create({
            subject: ticketData.subject,
            description: ticketData.description,
            priority: ticketData.priority,
            status: ticketData.status,
            channel: ticketData.channel,
            contactId: contact?._id,
            accountId: account?._id,
            departmentId: department?._id,
            productId: product?._id,
            assignedAgentId: assignedAgent?._id,
            teamId: team?._id,
            slaId: slaMap[ticketData.priority] || slaMap['medium'] || null,
            dueDate: ticketData.dueDate,
            classification: ticketData.classification,
            language: ticketData.language,
            companyId,
            createdBy: req.user._id
          });

          // Create ticket history
          await TicketHistory.create({
            ticketId: ticket._id,
            fieldChanged: 'ticket_created',
            oldValue: null,
            newValue: 'Ticket created via bulk upload',
            changedBy: req.user._id,
            changedByType: 'agent',
            changeType: 'create'
          });

          results.successCount++;
          results.createdTickets.push({
            _id: ticket._id,
            subject: ticket.subject,
            priority: ticket.priority,
            status: ticket.status
          });

        } catch (error) {
          results.failureCount++;
          results.errors.push({
            row: rowNumber,
            data: row,
            errors: [{
              field: 'general',
              message: error.message
            }]
          });
        }
      }

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

      res.json({
        success: true,
        message: 'Bulk upload completed',
        summary: {
          ...results,
          processingTime: `${processingTime}s`
        }
      });

    } catch (error) {
      console.error('Bulk upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Bulk upload failed',
        error: error.message
      });
    }
  }
);

// Download template endpoint
router.get('/tickets/bulk-upload/template', authenticateToken, (req, res) => {
  const templatePath = path.join(__dirname, '../templates/ticket-upload-template.csv');
  res.download(templatePath, 'ticket-upload-template.csv');
});

// Get SLA rules
router.get('/:companyId/sla-rules', authenticateToken, async (req, res) => {
  try {
    const slaRules = await SlaRule.find({ isActive: true });
    res.json({ slaRules });
  } catch (error) {
    console.error('Get SLA rules error:', error);
    res.status(500).json({ message: 'Failed to fetch SLA rules' });
  }
});

// Get Tags
router.get('/:companyId/tags', authenticateToken, async (req, res) => {
  try {
    const tags = await Tag.find({});
    res.json({ tags });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ message: 'Failed to fetch tags' });
  }
});

// Add Comment
router.post('/:companyId/tickets/:id/comments', authenticateToken, upload.array('attachments'), async (req, res) => {
  try {
    const { id } = req.params;
    const { commentText, isInternal } = req.body;
    const files = req.files || [];

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const attachments = files.map(file => ({
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype
    }));

    const comment = await TicketComment.create({
      ticketId: id,
      authorType: req.user.role === 'requester' ? 'Contact' : 'User', // Simplified logic, adjust as needed
      authorId: req.user._id,
      commentText,
      isInternal: isInternal === 'true',
      attachments
    });

    // Populate author details
    // Note: authorType 'User' refers to internal users, 'Contact' to customers.
    // Since req.user is from User model, we might need to adjust if customers are in Contact model.
    // Assuming req.user is always a User for now as per authenticateToken.
    // If customers authenticate differently, this needs adjustment.

    // For now, let's assume all authenticated users are Users.
    // If the user is a customer, they might be a Contact.
    // But authenticateToken uses User model.

    // Let's stick to 'User' for now if they are in User model.
    // If they are 'customer' role in User model.

    // Wait, TicketComment schema has 'agent', 'contact', 'system', 'User', 'Contact'.
    // If req.user is a User, we use 'User'.

    // Actually, let's be more precise.
    let authorType = 'User';
    if (req.user.role === 'requester') {
      // If customer is a User, use User.
      // If customer is a Contact, use Contact.
      // authenticateToken fetches from User.
      authorType = 'User';
    }

    // However, the schema validation might fail if we use 'User' and it expects 'agent' or 'contact' from the original enum?
    // I updated the enum to include 'User' and 'Contact'.

    // Let's populate it to return
    const populatedComment = await TicketComment.findById(comment._id).populate('author', 'fullName email avatar');

    res.status(201).json({ comment: populatedComment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// Get Comments
router.get('/:companyId/tickets/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await TicketComment.find({ ticketId: id })
      .sort({ createdAt: -1 })
      .populate('author', 'fullName email avatar'); // This works if authorType is set correctly and refPath works

    // If authorType is 'User', it looks up User collection.

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// Upload Ticket Attachment
router.post('/:companyId/tickets/:id/attachments', authenticateToken, upload.array('attachments'), async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const uploadedFiles = files.map(file => ({
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    }));

    ticket.attachments.push(...uploadedFiles);
    await ticket.save();

    res.json({ message: 'Files uploaded', files: uploadedFiles });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ message: 'Failed to upload attachments' });
  }
});

// Get Ticket Attachments
router.get('/:companyId/tickets/:id/attachments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id).select('attachments').populate('attachments.uploadedBy', 'fullName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({ attachments: ticket.attachments });
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ message: 'Failed to fetch attachments' });
  }
});

// Close Ticket
router.patch('/:companyId/tickets/:id/close', authenticateToken, requireRole(['admin', 'company_admin', 'department_admin', 'agent']), async (req, res) => {
  try {
    const { id, companyId } = req.params;
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Agent can only close assigned tickets
    if (req.user.role === 'agent') {
      const isAssigned = ticket.assignedAgentId?.toString() === req.user._id.toString() ||
        ticket.assignedTo?.toString() === req.user._id.toString();
      if (!isAssigned) {
        return res.status(403).json({ message: 'Agents can only close assigned tickets' });
      }
    }

    // Department Admin can only close dept tickets
    if (req.user.role === 'department_admin') {
      if (ticket.departmentId?.toString() !== req.user.departmentId?.toString()) {
        return res.status(403).json({ message: 'Can only close tickets in your department' });
      }
    }

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    await ticket.save();

    // Create audit log
    const AuditLog = (await import('../models/AuditLog.js')).default;
    await AuditLog.create({
      entityType: 'ticket',
      entityId: ticket._id,
      action: 'close',
      newValue: { status: 'closed' },
      performedBy: req.user._id,
      performedByRole: req.user.role,
      companyId: companyId,
      description: `Ticket closed by ${req.user.fullName}`
    });

    res.json({ message: 'Ticket closed successfully', ticket });
  } catch (error) {
    console.error('Close ticket error:', error);
    res.status(500).json({ message: 'Failed to close ticket' });
  }
});

// Reopen Ticket
router.patch('/:companyId/tickets/:id/reopen', authenticateToken, requireRole(['admin', 'company_admin', 'department_admin', 'agent', 'requester']), async (req, res) => {
  try {
    const { id, companyId } = req.params;
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Requester (requester) can only reopen own tickets within SLA window (7 days)
    if (req.user.role === 'requester') {
      const isOwner = ticket.createdBy?.toString() === req.user._id.toString();
      if (!isOwner) {
        return res.status(403).json({ message: 'Can only reopen your own tickets' });
      }

      // SLA-bound: Check if ticket was closed within last 7 days
      if (ticket.closedAt) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (ticket.closedAt < sevenDaysAgo) {
          return res.status(403).json({ message: 'Cannot reopen ticket - SLA window expired (7 days)' });
        }
      }
    }

    // Agent: Limited - can only reopen assigned tickets
    if (req.user.role === 'agent') {
      const isAssigned = ticket.assignedAgentId?.toString() === req.user._id.toString() ||
        ticket.assignedTo?.toString() === req.user._id.toString();
      if (!isAssigned) {
        return res.status(403).json({ message: 'Agents can only reopen assigned tickets' });
      }
    }

    ticket.status = 'reopened';
    ticket.closedAt = null;
    ticket.resolvedAt = null;
    await ticket.save();

    // Create audit log
    const AuditLog = (await import('../models/AuditLog.js')).default;
    await AuditLog.create({
      entityType: 'ticket',
      entityId: ticket._id,
      action: 'reopen',
      newValue: { status: 'reopened' },
      performedBy: req.user._id,
      performedByRole: req.user.role,
      companyId: companyId,
      description: `Ticket reopened by ${req.user.fullName}`
    });

    res.json({ message: 'Ticket reopened successfully', ticket });
  } catch (error) {
    console.error('Reopen ticket error:', error);
    res.status(500).json({ message: 'Failed to reopen ticket' });
  }
});

// Escalate Ticket
router.patch('/:companyId/tickets/:id/escalate', authenticateToken, requireRole(['admin', 'company_admin', 'department_admin', 'agent']), async (req, res) => {
  try {
    const { id, companyId } = req.params;
    const { reason } = req.body;
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const previousStatus = ticket.status;
    ticket.status = 'escalated';
    await ticket.save();

    // Create audit log
    const AuditLog = (await import('../models/AuditLog.js')).default;
    await AuditLog.create({
      entityType: 'ticket',
      entityId: ticket._id,
      action: 'escalate',
      previousValue: { status: previousStatus },
      newValue: { status: 'escalated', reason },
      performedBy: req.user._id,
      performedByRole: req.user.role,
      companyId: companyId,
      description: `Ticket escalated by ${req.user.fullName}${reason ? ': ' + reason : ''}`
    });

    res.json({ message: 'Ticket escalated successfully', ticket });
  } catch (error) {
    console.error('Escalate ticket error:', error);
    res.status(500).json({ message: 'Failed to escalate ticket' });
  }
});

// Soft Delete Ticket
router.delete('/:companyId/tickets/:id/soft-delete', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { id, companyId } = req.params;
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.isActive = false;
    await ticket.save();

    // Create audit log
    const AuditLog = (await import('../models/AuditLog.js')).default;
    await AuditLog.create({
      entityType: 'ticket',
      entityId: ticket._id,
      action: 'soft_delete',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      companyId: companyId,
      description: `Ticket soft-deleted by ${req.user.fullName}`
    });

    res.json({ message: 'Ticket soft-deleted successfully' });
  } catch (error) {
    console.error('Soft delete ticket error:', error);
    res.status(500).json({ message: 'Failed to soft-delete ticket' });
  }
});

// Hard Delete Ticket (Super Admin only)
router.delete('/:companyId/tickets/:id/hard-delete', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id, companyId } = req.params;
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Create audit log before deletion
    const AuditLog = (await import('../models/AuditLog.js')).default;
    await AuditLog.create({
      entityType: 'ticket',
      entityId: ticket._id,
      action: 'hard_delete',
      previousValue: { subject: ticket.subject, status: ticket.status },
      performedBy: req.user._id,
      performedByRole: req.user.role,
      companyId: companyId,
      description: `Ticket permanently deleted by ${req.user.fullName}`
    });

    await Ticket.findByIdAndDelete(id);

    res.json({ message: 'Ticket permanently deleted' });
  } catch (error) {
    console.error('Hard delete ticket error:', error);
    res.status(500).json({ message: 'Failed to delete ticket' });
  }
});

// Export Tickets (CSV)
router.get('/:companyId/tickets/export', authenticateToken, requireRole(['admin', 'company_admin']), async (req, res) => {
  try {
    const { companyId } = req.params;
    const { status, priority, startDate, endDate } = req.query;

    const filter = { companyId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const tickets = await Ticket.find(filter)
      .populate('contactId', 'firstName lastName email')
      .populate('assignedAgentId', 'fullName email')
      .populate('departmentId', 'departmentName')
      .sort({ createdAt: -1 });

    // Create CSV content
    const headers = ['ID', 'Subject', 'Status', 'Priority', 'Contact', 'Assigned To', 'Department', 'Created At', 'Due Date'];
    const rows = tickets.map(t => [
      t._id.toString(),
      `"${(t.subject || '').replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.contactId ? `"${t.contactId.firstName || ''} ${t.contactId.lastName || ''}"` : '',
      t.assignedAgentId ? `"${t.assignedAgentId.fullName || ''}"` : '',
      t.departmentId ? `"${t.departmentId.departmentName || ''}"` : '',
      t.createdAt ? t.createdAt.toISOString() : '',
      t.dueDate ? t.dueDate.toISOString() : ''
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');

    // Create audit log
    const AuditLog = (await import('../models/AuditLog.js')).default;
    await AuditLog.create({
      entityType: 'ticket',
      entityId: null,
      action: 'export',
      newValue: { count: tickets.length, filters: { status, priority, startDate, endDate } },
      performedBy: req.user._id,
      performedByRole: req.user.role,
      companyId: companyId,
      description: `${tickets.length} tickets exported by ${req.user.fullName}`
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=tickets-export-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export tickets error:', error);
    res.status(500).json({ message: 'Failed to export tickets' });
  }
});

export default router;
