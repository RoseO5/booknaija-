import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { bookId, status } = req.body;
  if (!bookId || !['published', 'rejected', 'pending', 'flagged'].includes(status)) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  const client = await clientPromise;
  const db = client.db('booknaija');
  await db.collection('books').updateOne({ _id: new ObjectId(bookId) }, { $set: { status, updatedAt: new Date() } });
  res.status(200).json({ success: true });
}
