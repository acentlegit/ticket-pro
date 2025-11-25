import mongoose from 'mongoose';

const TagSchema = new mongoose.Schema({
  tagName: {
    type: String,
    required: [true, 'Tag name is required'],
    unique: true,
    trim: true,
    maxlength: [255, 'Tag name cannot exceed 255 characters'],
    lowercase: true
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue color
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  description: {
    type: String,
    trim: true
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
TagSchema.index({ tagName: 1 });
TagSchema.index({ isActive: 1 });

// Virtual for tickets count
TagSchema.virtual('ticketsCount', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'tags',
  count: true
});

export default mongoose.model('Tag', TagSchema);