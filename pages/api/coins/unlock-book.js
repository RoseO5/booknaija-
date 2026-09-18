import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { userId, bookId, bookTitle } = req.body;
    if (!userId || !bookId) {
      return res.status(400).json({ error: 'userId and bookId required' });
    }

    const client = await clientPromise;
    const db = client.db('booknaija');
    const UNLOCK_COST = 100;

    // 1. Check user's current coin balance
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if ((user.coins || 0) < UNLOCK_COST) {
      return res.status(400).json({ 
        error: `Insufficient coins. You need ${UNLOCK_COST} coins to unlock this book.`,
        currentBalance: user.coins || 0
      });
    }

    // 2. Calculate 24-hour expiration
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // 3. Deduct coins and add to premiumUnlocks
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $inc: { coins: -UNLOCK_COST },
        $push: {
          premiumUnlocks: {
            bookId,
            bookTitle: bookTitle || 'Unknown Book',
            unlockedAt: now,
            expiresAt
          },
          coinTransactions: {
            type: 'spend',
            amount: UNLOCK_COST,
            reason: `Unlocked book: ${bookTitle || bookId}`,
            date: now
          }
        }
      }
    );

    // 4. Update leaderboard (spending reduces net coins)
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await db.collection('coin_leaderboard').updateOne(
      { userId: userId, month: currentMonth },
      {
        $inc: { totalCoinsSpent: UNLOCK_COST, netCoins: -UNLOCK_COST },
        $set: { lastUpdated: now }
      },
      { upsert: true }
    );

    // 5. Get updated balance
    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    res.status(200).json({
      success: true,
      message: `✅ Book unlocked for 24 hours!`,
      newBalance: updatedUser.coins,
      expiresAt
    });
  } catch (error) {
    console.error('Unlock book error:', error);
    res.status(500).json({ error: error.message });
  }
}
