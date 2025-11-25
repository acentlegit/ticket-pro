import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema({
  roleName: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    maxlength: [255, 'Role name cannot exceed 255 characters']
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
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
RoleSchema.index({ roleName: 1 });
RoleSchema.index({ isActive: 1 });

// Virtual for agents count
RoleSchema.virtual('agentsCount', {
  ref: 'Agent',
  localField: '_id',
  foreignField: 'roleId',
  count: true
});

export default mongoose.model('Role', RoleSchema);