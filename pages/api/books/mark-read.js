import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { userId, bookId, timeSpent } = req.body;
    if (!userId || !bookId) return res.status(400).json({ error: 'userId and bookId required' });

    const client = await clientPromise;
    const db = client.db('booknaija');

    // Record the read (only if they spent 5+ minutes = 300 seconds)
    const isCompleted = timeSpent >= 300;

    await db.collection('reads').updateOne(
      { userId: new ObjectId(userId), bookId: new ObjectId(bookId) },
      {
        $set: {
          userId: new ObjectId(userId),
          bookId: new ObjectId(bookId),
          timeSpent,
          completed: isCompleted,
          lastReadAt: new Date()
        },
        $setOnInsert: {
          firstReadAt: new Date()
        }
      },
      { upsert: true }
    );

    // Count total completed books in last 6 months for competition
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const completedCount = await db.collection('reads').countDocuments({
      userId: new ObjectId(userId),
      completed: true,
      lastReadAt: { $gte: sixMonthsAgo }
    });

    res.status(200).json({ 
      success: true, 
      completed: isCompleted,
      totalBooksRead: completedCount,
      progressToPrize: `${completedCount}/50 books`
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: error.message });
  }
}
