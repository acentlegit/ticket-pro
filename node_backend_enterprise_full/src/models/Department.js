import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  departmentName: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    maxlength: [120, 'Department name cannot exceed 120 characters']
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: [120, 'Display name cannot exceed 120 characters']
  },
  logoUrl: {
    type: String,
    trim: true,
    validate: {
      validator: (v) => !v || /\.(png|jpg|jpeg)(\?.*)?$/i.test(v),
      message: 'Logo URL must end with PNG, JPG, or JPEG.'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  showInHelpCenter: {
    type: Boolean,
    default: true
  },
  agentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
DepartmentSchema.index({ companyId: 1 });
DepartmentSchema.index({ departmentName: 1 });

export default mongoose.model('Department', DepartmentSchema);