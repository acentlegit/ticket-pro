import mongoose from 'mongoose';

const AgentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [255, 'Full name cannot exceed 255 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: [true, 'Role is required']
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'suspended'],
      message: 'Status must be one of: active, inactive, suspended'
    },
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  avatar: {
    type: String
  },
  phoneNumber: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
AgentSchema.index({ email: 1 });
AgentSchema.index({ roleId: 1 });
AgentSchema.index({ teamId: 1 });
AgentSchema.index({ status: 1 });

// Virtual for assigned tickets count
AgentSchema.virtual('assignedTicketsCount', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'assignedAgentId',
  count: true
});

// Remove password from JSON output
AgentSchema.methods.toJSON = function() {
  const agent = this.toObject();
  delete agent.password;
  return agent;
};

export default mongoose.model('Agent', AgentSchema);