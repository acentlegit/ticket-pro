import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  street: { type: String, trim: true, maxlength: 200 },
  city: { type: String, trim: true, maxlength: 100 },
  state: { type: String, trim: true, maxlength: 100 },
  zipCode: { type: String, trim: true, maxlength: 20 },
  country: { type: String, trim: true, maxlength: 100 },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[0-9]{7,15}$/, 'Phone must be an international number (7–15 digits).']
  },
  mobile: {
    type: String,
    trim: true,
    match: [/^\+?[0-9]{7,15}$/, 'Mobile must be an international number (7–15 digits).']
  },
  fax: {
    type: String,
    trim: true,
    match: [/^\+?[0-9]{7,15}$/, 'Fax must be an international number (7–15 digits).']
  }
}, { _id: false });

const CompanySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [120, 'Company name cannot exceed 120 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  website: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: (v) => !v || /^https?:\/\/([a-z0-9.-]+\.[a-z]{2,})(:[0-9]{2,5})?(\/.*)?$/i.test(v),
      message: 'Website must be a valid HTTP/HTTPS URL.'
    }
  },
  employeeCount: {
    type: Number,
    min: [0, 'Employee count cannot be negative'],
    max: [1000000, 'Employee count cannot exceed 1,000,000'],
    default: 0
  },
  primaryContact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  currencyLocale: {
    type: String,
    trim: true,
    default: 'en-IN'
  },
  currencyCode: {
    type: String,
    trim: true,
    uppercase: true,
    default: 'INR',
    match: [/^[A-Z]{3}$/, 'Currency must be an ISO 4217 code (e.g., USD, INR, EUR).']
  },
  address: { type: AddressSchema },
  logoUrl: {
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
CompanySchema.index({ companyName: 1 });
CompanySchema.index({ primaryContact: 1 });
CompanySchema.index({ isActive: 1 });

export default mongoose.model('Company', CompanySchema);