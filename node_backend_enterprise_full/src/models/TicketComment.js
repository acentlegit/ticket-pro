import mongoose from 'mongoose';

const TicketCommentSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: [true, 'Ticket ID is required']
  },
  authorType: {
    type: String,
    enum: {
      values: ['agent', 'contact', 'system'],
      message: 'Author type must be one of: agent, contact, system'
    },
    required: [true, 'Author type is required']
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Author ID is required']
  },
  commentText: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true
  },
  isInternal: {
    type: Boolean,
    default: false
  },
  attachments: [{
    fileName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String
  }],
  editedAt: {
    type: Date
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
TicketCommentSchema.index({ ticketId: 1 });
TicketCommentSchema.index({ authorType: 1, authorId: 1 });
TicketCommentSchema.index({ createdAt: -1 });
TicketCommentSchema.index({ isInternal: 1 });

// Virtual to populate author based on authorType
TicketCommentSchema.virtual('author', {
  refPath: 'authorType',
  localField: 'authorId',
  foreignField: '_id',
  justOne: true
});

export default mongoose.model('TicketComment', TicketCommentSchema);