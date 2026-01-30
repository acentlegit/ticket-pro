import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ChatSessionSchema = new Schema({
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    agentId: { type: Schema.Types.ObjectId, ref: 'User' },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    type: { type: String, enum: ['chat', 'voice', 'video'], required: true },
    status: { type: String, enum: ['waiting', 'active', 'ended'], default: 'waiting' },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    duration: { type: Number } // in seconds
});

ChatSessionSchema.index({ customerId: 1, status: 1 });
ChatSessionSchema.index({ agentId: 1, status: 1 });

export default mongoose.model('ChatSession', ChatSessionSchema);
