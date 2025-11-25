import mongoose from 'mongoose';

const TicketHistorySchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: [true, 'Ticket ID is required']
  },
  fieldChanged: {
    type: String,
    required: [true, 'Field changed is required'],
    trim: true,
    maxlength: [255, 'Field name cannot exceed 255 characters']
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Changed by is required']
  },
  changedByType: {
    type: String,
    enum: {
      values: ['agent', 'contact', 'system'],
      message: 'Changed by type must be one of: agent, contact, system'
    },
    default: 'agent'
  },
  changeType: {
    type: String,
    enum: {
      values: ['create', 'update', 'delete', 'assign', 'status_change', 'priority_change'],
      message: 'Change type must be one of: create, update, delete, assign, status_change, priority_change'
    },
    default: 'update'
  },
  changedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
TicketHistorySchema.index({ ticketId: 1 });
TicketHistorySchema.index({ changedBy: 1 });
TicketHistorySchema.index({ changedAt: -1 });
TicketHistorySchema.index({ fieldChanged: 1 });
TicketHistorySchema.index({ changeType: 1 });

// Virtual to populate changedBy based on changedByType
TicketHistorySchema.virtual('changedByUser', {
  refPath: 'changedByType',
  localField: 'changedBy',
  foreignField: '_id',
  justOne: true
});

export default mongoose.model('TicketHistory', TicketHistorySchema);