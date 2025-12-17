import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  fullName: {   // covers both "name" and "fullName"
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [255, 'Full name cannot exceed 255 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phoneNumber: {   // covers both "phone" and "phoneNumber"
    type: String,
    trim: true,
    maxlength: [50, 'Phone number cannot exceed 50 characters']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {   // unified role handling
    type: String,
    enum: {
      values: ['admin', 'company_admin', 'department_admin', 'agent', 'requester'],
      message: 'Role must be one of: admin, company_admin, department_admin, agent, requester'
    },
    default: 'requester'
  },
  permissions: [{
    type: String
  }],
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  roleId: {   // optional reference for agent-specific role
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },
  teamId: {   // optional reference for agent-specific team
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  companyId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    // required: [true, 'Company is required']
  }],
  status: {   // agent-style status
    type: String,
    enum: {
      values: ['active', 'inactive', 'suspended'],
      message: 'Status must be one of: active, inactive, suspended'
    },
    default: 'active'
  },
  mobile: {
    type: String
  },
  channel: {
    type: String
  },
  fax: {
    type: String
  },
  avatar: {
    type: String,
    trim: true
  },
  lastLogin: {
    type: Date
  },
  isActive: {   // general user active flag
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ roleId: 1 });
UserSchema.index({ teamId: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for assigned tickets count (agent-specific)
UserSchema.virtual('assignedTicketsCount', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'assignedAgentId',
  count: true
});

// Remove password from JSON output
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model('User', UserSchema);