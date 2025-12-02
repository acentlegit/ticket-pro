import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [255, 'Full name cannot exceed 255 characters']
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
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
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
ContactSchema.index({ fullName: 1 });
ContactSchema.index({ isActive: 1 });

// Virtual for tickets count
ContactSchema.virtual('ticketsCount', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'contactId',
  count: true
});

export default mongoose.model('Contact', ContactSchema);