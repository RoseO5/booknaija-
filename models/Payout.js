import mongoose from 'mongoose';

const PayoutSchema = new mongoose.Schema({
  type: { type: String, enum: ['airtime', 'prize'], required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientPhone: { type: String, required: true },
  recipientName: { type: String, required: true },
  amount: { type: Number, required: true },
  month: { type: String, required: true },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  transactionId: { type: String },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.models.Payout || mongoose.model('Payout', PayoutSchema);
