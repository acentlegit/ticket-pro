import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [255, 'Account name cannot exceed 255 characters']
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [50, 'Phone number cannot exceed 50 characters']
  },
   country: {
    type: String,
    trim: true,
    maxlength: [50, 'Phone number cannot exceed 50 characters']
  },
  accountOwner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  website: {
    type: String,
    trim: true,
    maxlength: [255, 'Website cannot exceed 255 characters'],
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
AccountSchema.index({ website: 1 });
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