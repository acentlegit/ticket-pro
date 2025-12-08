import mongoose from 'mongoose';

const BrandingSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  logoUrl: {
    type: String,
    trim: true,
    validate: {
      validator: (v) => !v || /^https?:\/\/.+\.(png|jpg|jpeg)(\?.*)?$/i.test(v),
      message: 'Logo URL must end with PNG, JPG, or JPEG.'
    }
  },
  logoLinkbackUrl: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: (v) => !v || /^https?:\/\/([a-z0-9.-]+\.[a-z]{2,})(:[0-9]{2,5})?(\/.*)?$/i.test(v),
      message: 'Logo linkback must be a valid HTTP/HTTPS URL.'
    }
  },
  faviconUrl: {
    type: String,
    trim: true,
    validate: {
      validator: (v) => !v || /^https?:\/\/.+\.(png|jpg|jpeg|gif|ico)(\?.*)?$/i.test(v),
      message: 'Favicon URL must end with PNG, JPG, JPEG, GIF, or ICO.'
    }
  },
  useDefaultBranding: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Branding', BrandingSchema);