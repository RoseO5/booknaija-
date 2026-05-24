import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ error: 'Book ID required' });

    const client = await clientPromise;
    const db = client.db('booknaija');
    const book = await db.collection('books').findOne({ _id: new ObjectId(bookId) });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const newReports = (book.reports || 0) + 1;
    const update = { $set: { reports: newReports } };
    
    // Auto-flag if 3+ reports
    if (newReports >= 3 && !book.abuseFlags?.includes('user-reports')) {
      update.$set.status = 'flagged';
      update.$set.abuseFlags = [...(book.abuseFlags || []), 'user-reports'];
    }

    await db.collection('books').updateOne({ _id: new ObjectId(bookId) }, update);
    res.status(200).json({ success: true, reports: newReports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
