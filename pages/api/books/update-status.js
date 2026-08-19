import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  
  const { bookId, status, genre } = req.body;
  if (!bookId || !['published', 'rejected', 'pending', 'flagged'].includes(status)) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  
  const client = await clientPromise;
  const db = client.db('booknaija');
  
  // ✅ NEW: If a genre is provided, save it along with the status
  const updateData = { status, updatedAt: new Date() };
  if (genre) {
    updateData.genre = genre;
  }
  
  await db.collection('books').updateOne({ _id: new ObjectId(bookId) }, { $set: updateData });
  res.status(200).json({ success: true });
}
