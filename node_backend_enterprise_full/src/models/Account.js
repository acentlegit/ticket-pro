import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [255, 'Account name cannot exceed 255 characters']
  },
  address: {
    type: String,
    trim: true
  },
  domain: {
    type: String,
    trim: true,
    maxlength: [255, 'Domain cannot exceed 255 characters'],
    lowercase: true
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
AccountSchema.index({ accountName: 1 });
AccountSchema.index({ domain: 1 });
AccountSchema.index({ isActive: 1 });

// Virtual for contacts count
AccountSchema.virtual('contactsCount', {
  ref: 'Contact',
  localField: '_id',
  foreignField: 'accountId',
  count: true
});

// Virtual for tickets count
AccountSchema.virtual('ticketsCount', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'accountId',
  count: true
});

export default mongoose.model('Account', AccountSchema);