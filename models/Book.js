import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorPhone: { type: String },
  authorNetwork: { type: String, enum: ['MTN', 'Airtel', 'Glo', '9mobile'] },
  description: { type: String },
  coverUrl: { type: String },
  pdfUrl: { type: String, required: true },
  category: { type: String, default: 'General' },
  pages: { type: Number },
  status: { type: String, enum: ['pending', 'published', 'rejected'], default: 'pending' },
  stats: {
    totalReads: { type: Number, default: 0 },
    totalMinutes: { type: Number, default: 0 },
    uniqueReaders: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.models.Book || mongoose.model('Book', BookSchema);
