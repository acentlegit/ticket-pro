import mongoose from 'mongoose';

const InvitationSchema = new mongoose.Schema({
  recipientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  recipientName: {
    type: String,
    required: true,
    trim: true
  },
  inviterName: {
    type: String,
    required: true
  },
  inviterEmail: {
    type: String,
    required: true
  },
  organizationName: {
    type: String,
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

InvitationSchema.index({ token: 1 });
InvitationSchema.index({ recipientEmail: 1 });
InvitationSchema.index({ status: 1 });
InvitationSchema.index({ expiresAt: 1 });

export default mongoose.model('Invitation', InvitationSchema);
