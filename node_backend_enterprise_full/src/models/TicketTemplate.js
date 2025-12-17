import mongoose from 'mongoose';

const TicketTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Template name is required'],
        trim: true,
        maxlength: [255, 'Name cannot exceed 255 characters']
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
        maxlength: [255, 'Subject cannot exceed 255 characters']
    },
    description: {
        type: String,
        trim: true
    },
    priority: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high', 'urgent'],
            message: 'Priority must be one of: low, medium, high, urgent'
        },
        default: 'medium'
    },
    category: {
        type: String,
        trim: true,
        maxlength: [100, 'Category cannot exceed 100 characters']
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
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
TicketTemplateSchema.index({ companyId: 1 });
TicketTemplateSchema.index({ name: 1 });
TicketTemplateSchema.index({ isActive: 1 });

export default mongoose.model('TicketTemplate', TicketTemplateSchema);
