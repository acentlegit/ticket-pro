import mongoose from 'mongoose';

const TicketAttachmentSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: [true, 'Ticket ID is required']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required'],
    trim: true
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
    maxlength: [500, 'File path cannot exceed 500 characters']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Uploaded by is required']
  },
  uploadedByType: {
    type: String,
    enum: {
      values: ['agent', 'contact'],
      message: 'Uploaded by type must be one of: agent, contact'
    },
    default: 'agent'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
TicketAttachmentSchema.index({ ticketId: 1 });
TicketAttachmentSchema.index({ uploadedBy: 1 });
TicketAttachmentSchema.index({ uploadedAt: -1 });
TicketAttachmentSchema.index({ mimeType: 1 });

// Virtual to populate uploadedBy based on uploadedByType
TicketAttachmentSchema.virtual('uploader', {
  refPath: 'uploadedByType',
  localField: 'uploadedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual for file size in human readable format
TicketAttachmentSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

export default mongoose.model('TicketAttachment', TicketAttachmentSchema);