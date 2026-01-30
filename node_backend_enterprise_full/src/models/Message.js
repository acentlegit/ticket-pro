import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['customer', 'agent', 'admin'], required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

MessageSchema.index({ sessionId: 1, createdAt: -1 });

export default mongoose.model('Message', MessageSchema);
