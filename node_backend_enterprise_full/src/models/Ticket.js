
import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [255, 'Subject cannot exceed 255 characters']
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
classification:{
type: String,
},
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  assignedAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  channel: {
    type: String,
    enum: {
      values: ['email', 'phone', 'chat', 'web', 'social', 'api'],
      message: 'Channel must be one of: email, phone, chat, web, social, api'
    },
    default: 'web'
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be one of: low, medium, high, urgent'
    },
    required: [true, 'Priority is required'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: {
      values: ['open', 'in-progress', 'pending', 'resolved', 'closed'],
      message: 'Status must be one of: open, in-progress, pending, resolved, closed'
    },
    default: 'open'
  },
  slaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SlaRule'
  },
  dueDate: {
    type: Date
  },
  customerRespondedTime: {
    type: Date
  },
  agentRespondedTime: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  // Legacy fields for backward compatibility
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  slaStatus: {
    type: String,
    enum: {
      values: ['within-sla', 'approaching-breach', 'breached'],
      message: 'SLA status must be one of: within-sla, approaching-breach, breached'
    },
    default: 'within-sla'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
TicketSchema.index({ status: 1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ createdBy: 1 });
TicketSchema.index({ assignedTo: 1 });
TicketSchema.index({ slaStatus: 1 });
TicketSchema.index({ createdAt: -1 });
TicketSchema.index({ dueDate: 1 });
TicketSchema.index({ category: 1 });
TicketSchema.index({ tags: 1 });

// Compound indexes for common queries
TicketSchema.index({ status: 1, priority: 1 });
TicketSchema.index({ assignedTo: 1, status: 1 });
TicketSchema.index({ createdBy: 1, status: 1 });

// Virtual for ticket age in hours
TicketSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Pre-save middleware to set resolved/closed dates
TicketSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  next();
});

export default mongoose.model('Ticket', TicketSchema);
