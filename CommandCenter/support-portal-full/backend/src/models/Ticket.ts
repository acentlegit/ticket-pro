import mongoose from 'mongoose';
const TicketSchema = new mongoose.Schema({
  status: String,
  confidence: Number,
  breached: Boolean,
});
export default mongoose.model('Ticket', TicketSchema);
