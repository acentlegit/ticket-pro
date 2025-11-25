import mongoose from 'mongoose';

const PermissionSchema = new mongoose.Schema({
  permissionKey: {
    type: String,
    required: [true, 'Permission key is required'],
    unique: true,
    trim: true,
    maxlength: [255, 'Permission key cannot exceed 255 characters']
  },
  description: {
    type: String,
    trim: true
  },
  module: {
    type: String,
    required: [true, 'Module is required'],
    trim: true,
    enum: ['tickets', 'users', 'accounts', 'reports', 'settings', 'admin']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
    enum: ['create', 'read', 'update', 'delete', 'manage']
  }
}, {
  timestamps: true
});

// Indexes
PermissionSchema.index({ permissionKey: 1 });
PermissionSchema.index({ module: 1 });
PermissionSchema.index({ action: 1 });
PermissionSchema.index({ module: 1, action: 1 });

export default mongoose.model('Permission', PermissionSchema);