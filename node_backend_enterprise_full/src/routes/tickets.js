
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

// Create ticket
router.post('/:companyId/tickets', authenticateToken, requireRole(['admin', 'supervisor', 'agent', 'customer']), async (req, res) => {
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
        accountId : account._id || null
      });
    }
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
      language: language || null,
      classification: classification || null,
      attachments: attachments || [],
      createdBy: req.user._id,
      isActive: true,
      companyId: companyId || null,
    };
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
router.get('/:companyId/tickets', authenticateToken, requireRole(['admin', 'supervisor', 'agent']), async (req, res) => {
  try {
    const { status, priority, assignedTo, page = 1, limit = 50 } = req.query;
    const { companyId } = req.params;

    // Build filter query
    const filter = { companyId };
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
    const canView = req.user.role === 'admin' ||
      req.user.role === 'supervisor' ||
      req.user.role === 'agent' ||
      ticket.createdBy._id.toString() === req.user._id.toString();

    if (!canView) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Failed to fetch ticket' });
  }
});

// Update ticket (PUT - full update)
router.put('/:companyId/tickets/:id', authenticateToken, requireRole(['admin', 'supervisor', 'agent']), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
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
router.patch('/:companyId/tickets/:id', authenticateToken, requireRole(['admin', 'supervisor', 'agent']), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    const { companyId } = req.params;

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
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

export default router;
