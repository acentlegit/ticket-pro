import mongoose from 'mongoose';

const RoutingRuleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Rule name is required'],
        trim: true,
        maxlength: [255, 'Name cannot exceed 255 characters']
    },
    description: {
        type: String,
        trim: true
    },
    conditions: {
        priority: [{
            type: String,
            enum: ['low', 'medium', 'high', 'urgent']
        }],
        channel: [{
            type: String,
            enum: ['email', 'phone', 'chat', 'web', 'social', 'api']
        }],
        keywords: [String],
        category: [String]
    },
    actions: {
        assignToAgent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        assignToTeam: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        assignToDepartment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department'
        },
        setPriority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent']
        },
        addTags: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tag'
        }]
    },
    priority: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
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
RoutingRuleSchema.index({ companyId: 1 });
RoutingRuleSchema.index({ priority: -1 });
RoutingRuleSchema.index({ isActive: 1 });

export default mongoose.model('RoutingRule', RoutingRuleSchema);
