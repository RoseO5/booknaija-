import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { userId, userName, userEmail } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const client = await clientPromise;
    const db = client.db('booknaija');
    const ENTRY_FEE_COINS = 100;
    const ENTRY_FEE_NAIRA = 100;

    // Check user's subscription and coin balance
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // ✅ NEW: Strict check for active subscription
    if (!user.subscription?.active) {
      return res.status(403).json({ 
        error: '🔒 Trivia is exclusively for subscribed readers. Please subscribe to enter!' 
      });
    }

    if ((user.coins || 0) < ENTRY_FEE_COINS) {
      return res.status(400).json({ 
        error: `Insufficient coins. You need ${ENTRY_FEE_COINS} coins to enter.`,
        currentBalance: user.coins || 0,
        needsPurchase: true
      });
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Check if already entered
    const existingEntry = await db.collection('trivia_entries').findOne({
      month: currentMonth,
      'players.userId': userId
    });

    if (existingEntry) {
      return res.status(400).json({ error: 'You have already entered this month\'s tournament!' });
    }

    // Deduct coins from user
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $inc: { coins: -ENTRY_FEE_COINS },
        $push: {
          coinTransactions: {
            type: 'spend',
            amount: ENTRY_FEE_COINS,
            reason: `Entered Monthly Trivia Tournament (${currentMonth})`,
            date: now
          }
        }
      }
    );

    // Add to Trivia Pool & Register Player
    await db.collection('trivia_entries').updateOne(
      { month: currentMonth },
      {
        $inc: { totalPlayers: 1, totalPoolNaira: ENTRY_FEE_NAIRA },
        $push: {
          players: {
            userId,
            userName,
            userEmail,
            score: 0,
            completionTime: 999999,
            finished: false,
            enteredAt: now
          }
        }
      },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: '✅ Successfully entered the trivia tournament! Good luck!',
      newBalance: (user.coins || 0) - ENTRY_FEE_COINS
    });
  } catch (error) {
    console.error('Trivia entry error:', error);
    res.status(500).json({ error: error.message });
  }
}
