import mongoose from 'mongoose';

const CannedResponseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [255, 'Title cannot exceed 255 characters']
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        trim: true
    },
    category: {
        type: String,
        trim: true,
        maxlength: [100, 'Category cannot exceed 100 characters']
    },
    shortcut: {
        type: String,
        trim: true,
        maxlength: [50, 'Shortcut cannot exceed 50 characters']
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
CannedResponseSchema.index({ companyId: 1 });
CannedResponseSchema.index({ category: 1 });
CannedResponseSchema.index({ shortcut: 1 });
CannedResponseSchema.index({ isActive: 1 });

export default mongoose.model('CannedResponse', CannedResponseSchema);
