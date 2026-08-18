import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { userId, bookId } = req.body; 
    if (!userId || !bookId) return res.status(400).json({ error: 'userId and bookId required' });

    const client = await clientPromise;
    const db = client.db('booknaija');

    // 1. 🛡️ ANTI-CHEAT: Verify the server-side tracked time
    // Note: reading_progress stores userId and bookId as STRINGS from the frontend
    const progress = await db.collection('reading_progress').findOne({
      userId: userId, 
      bookId: bookId
    });

    const serverTimeSpent = progress ? progress.totalTimeSpent : 0;
    const isCompleted = serverTimeSpent >= 300; // Must have spent 5+ mins in the actual reader

    if (!isCompleted) {
      const mins = Math.floor(serverTimeSpent / 60);
      const secs = serverTimeSpent % 60;
      return res.status(400).json({ 
        error: `Please read the book in the secure reader for at least 5 minutes. Your tracked time is currently ${mins}m ${secs}s.` 
      });
    }

    // 2. Record the valid completion in the 'reads' collection
    await db.collection('reads').updateOne(
      { userId: new ObjectId(userId), bookId: new ObjectId(bookId) },
      {
        $set: {
          userId: new ObjectId(userId),
          bookId: new ObjectId(bookId),
          timeSpent: serverTimeSpent,
          completed: true,
          lastReadAt: new Date()
        },
        $setOnInsert: {
          firstReadAt: new Date()
        }
      },
      { upsert: true }
    );

    // 3. Count total completed books in last 6 months for competition
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const completedCount = await db.collection('reads').countDocuments({
      userId: new ObjectId(userId),
      completed: true,
      lastReadAt: { $gte: sixMonthsAgo }
    });

    res.status(200).json({
      success: true,
      completed: true,
      totalBooksRead: completedCount,
      progressToPrize: `${completedCount}/50 books`,
      trackedTime: serverTimeSpent
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: error.message });
  }
}
