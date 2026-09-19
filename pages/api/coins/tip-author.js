import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { userId, authorEmail, bookId, bookTitle } = req.body;
    if (!userId || !authorEmail) {
      return res.status(400).json({ error: 'userId and authorEmail required' });
    }

    const client = await clientPromise;
    const db = client.db('booknaija');
    const TIP_COST = 50; // 50 coins
    const TIP_NAIRA_VALUE = 5; // Author gets ₦5

    // 1. Check user's current coin balance
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if ((user.coins || 0) < TIP_COST) {
      return res.status(400).json({ 
        error: `Insufficient coins. You need ${TIP_COST} coins to tip the author.`,
        currentBalance: user.coins || 0
      });
    }

    const now = new Date();

    // 2. Deduct coins from user
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $inc: { coins: -TIP_COST },
        $push: {
          coinTransactions: {
            type: 'spend',
            amount: TIP_COST,
            reason: `Tipped author for: ${bookTitle || bookId}`,
            date: now
          }
        }
      }
    );

    // 3. Add tip earnings to author
    await db.collection('authors').updateOne(
      { email: authorEmail },
      {
        $inc: { 
          'earnings.tips': TIP_NAIRA_VALUE,
          'earnings.total': TIP_NAIRA_VALUE
        },
        $push: {
          'earnings.transactions': {
            type: 'tip',
            amount: TIP_NAIRA_VALUE,
            bookId: bookId,
            bookTitle: bookTitle || 'Unknown Book',
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
        $inc: { totalCoinsSpent: TIP_COST, netCoins: -TIP_COST },
        $set: { lastUpdated: now }
      },
      { upsert: true }
    );

    // 5. Get updated balance
    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    res.status(200).json({
      success: true,
      message: `✅ Successfully tipped the author!`,
      newBalance: updatedUser.coins
    });
  } catch (error) {
    console.error('Tip author error:', error);
    res.status(500).json({ error: error.message });
  }
}
