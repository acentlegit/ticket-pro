import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
    entityType: {
        type: String,
        required: true,
        enum: ['ticket', 'user', 'company', 'department', 'sla', 'routing', 'template', 'canned_response']
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['create', 'update', 'delete', 'close', 'reopen', 'escalate', 'assign', 'comment', 'soft_delete', 'hard_delete', 'export']
    },
    previousValue: {
        type: mongoose.Schema.Types.Mixed
    },
    newValue: {
        type: mongoose.Schema.Types.Mixed
    },
    changedFields: [{
        type: String
    }],
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    performedByRole: {
        type: String
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    description: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for efficient queries
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ companyId: 1 });
AuditLogSchema.index({ performedBy: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });

// Compound index for common queries
AuditLogSchema.index({ companyId: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, companyId: 1, createdAt: -1 });

export default mongoose.model('AuditLog', AuditLogSchema);
