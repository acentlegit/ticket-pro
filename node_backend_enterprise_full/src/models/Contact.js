import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  firstName: {
    type: String,
    // required: [true, 'First name is required'],
    trim: true,
    maxlength: [255, 'First name cannot exceed 255 characters']
  },
  lastName: {
    type: String,
    // required: [true, 'Last name is required'],
    trim: true,
    maxlength: [255, 'Last name cannot exceed 255 characters']
  },
  secondaryEmail: {
    type: String,
    trim: true,
    maxlength: [255, 'Secondary email cannot exceed 255 characters']
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phoneNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Phone number cannot exceed 50 characters']
  },
  mobileNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Mobile number cannot exceed 50 characters']
  },
  type: {
    type: String,
    trim: true,
    maxlength: [50, 'Type cannot exceed 50 characters']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [50, 'Title cannot exceed 50 characters']
  },
  language: {
    type: String,
    trim: true,
    maxlength: [50, 'Language cannot exceed 50 characters']
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  accountId: {   // 🔑 One Contact → One Account
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Account is required']
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
ContactSchema.index({ email: 1 });
ContactSchema.index({ companyId: 1 });
ContactSchema.index({ accountId: 1 });
ContactSchema.index({ isActive: 1 });

// Virtual for tickets count
ContactSchema.virtual('ticketsCount', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'contactId',
  count: true
});

export default mongoose.model('Contact', ContactSchema);