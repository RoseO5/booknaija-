import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['admin', 'reader', 'author'], default: 'reader' },
  network: { type: String, enum: ['MTN', 'Airtel', 'Glo', '9mobile'] },
  subscription: {
    active: { type: Boolean, default: false },
    startDate: Date,
    endDate: Date,
    amount: { type: Number, default: 1000 }
  },
  stats: {
    booksRead: { type: Number, default: 0 },
    totalMinutes: { type: Number, default: 0 },
    eligibleForPrize: { type: Boolean, default: false }
  }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
