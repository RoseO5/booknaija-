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

    // 1. Update the user's reading progress for this specific book
    await db.collection('reading_progress').updateOne(
      { userId, bookId },
      { 
        $inc: { totalTimeSpent: timeSpent },
        $set: { lastRead: new Date() }
      },
      { upsert: true }
    );

    // 2. Update the user's overall prize draw progress (e.g., every 5 mins = 1 point)
    const pointsEarned = Math.floor(timeSpent / 300); // 1 point per 5 minutes
    
    if (pointsEarned > 0) {
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $inc: { prizeDrawPoints: pointsEarned } }
      );
    }

    res.status(200).json({ success: true, message: 'Reading progress updated' });
  } catch (error) {
    console.error('❌ TRACKING ERROR:', error);
        res.status(500).json({ error: 'Server error' });
  }
}
