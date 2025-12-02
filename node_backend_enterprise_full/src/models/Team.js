import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [255, 'Team name cannot exceed 255 characters']
  },
  departmentHeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  },
  description: {
    type: String,
    trim: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
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
TeamSchema.index({ teamName: 1 });
TeamSchema.index({ departmentHeadId: 1 });
TeamSchema.index({ companyId: 1 });
TeamSchema.index({ isActive: 1 });

// Virtual for agents count
TeamSchema.virtual('agentsCount', {
  ref: 'Agent',
  localField: '_id',
  foreignField: 'teamId',
  count: true
});

// Virtual for tickets count
TeamSchema.virtual('ticketsCount', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'teamId',
  count: true
});

export default mongoose.model('Team', TeamSchema);