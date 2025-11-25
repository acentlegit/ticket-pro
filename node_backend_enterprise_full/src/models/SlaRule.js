import mongoose from 'mongoose';

const SlaRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'SLA rule name is required'],
    trim: true,
    maxlength: [255, 'Name cannot exceed 255 characters']
  },
  firstResponseTimeMinutes: {
    type: Number,
    required: [true, 'First response time is required'],
    min: [1, 'First response time must be at least 1 minute']
  },
  resolutionTimeMinutes: {
    type: Number,
    required: [true, 'Resolution time is required'],
    min: [1, 'Resolution time must be at least 1 minute']
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be one of: low, medium, high, urgent'
    }
  },
  conditions: {
    ticketType: [String],
    priority: [String],
    channel: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
SlaRuleSchema.index({ name: 1 });
SlaRuleSchema.index({ priority: 1 });
SlaRuleSchema.index({ isActive: 1 });

// Virtual for tickets count
SlaRuleSchema.virtual('ticketsCount', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'slaId',
  count: true
});

// Virtual for first response time in hours
SlaRuleSchema.virtual('firstResponseTimeHours').get(function() {
  return Math.round((this.firstResponseTimeMinutes / 60) * 100) / 100;
});

// Virtual for resolution time in hours
SlaRuleSchema.virtual('resolutionTimeHours').get(function() {
  return Math.round((this.resolutionTimeMinutes / 60) * 100) / 100;
});

export default mongoose.model('SlaRule', SlaRuleSchema);