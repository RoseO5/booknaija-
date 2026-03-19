import mongoose from 'mongoose';

const ReadingSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  bookTitle: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  minutesRead: { type: Number, required: true },
  pagesRead: { type: Number, required: true },
  month: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.ReadingSession || mongoose.model('ReadingSession', ReadingSessionSchema);
