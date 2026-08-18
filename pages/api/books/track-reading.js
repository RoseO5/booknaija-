import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { bookId, userId, timeSpent } = req.body;

  if (!bookId || !userId || !timeSpent) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    // 1. Log the reading session
    await db.collection('reading_progress').updateOne(
      { userId, bookId },
      { 
        $inc: { totalTimeSpent: timeSpent },
        $set: { lastRead: new Date() }
      },
      { upsert: true }
    );

    // 2. Add to overall prize draw points (e.g., 1 point per 5 minutes of reading)
    const pointsEarned = Math.floor(timeSpent / 300);
    if (pointsEarned > 0) {
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $inc: { prizeDrawPoints: pointsEarned } }
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ TRACKING ERROR:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
