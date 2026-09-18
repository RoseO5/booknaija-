import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { userId, amount, reason } = req.body;
    if (!userId || !amount || !reason) {
      return res.status(400).json({ error: 'userId, amount, and reason required' });
    }

    const client = await clientPromise;
    const db = client.db('booknaija');

    // 1. Award coins to user
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $inc: { coins: amount },
        $push: {
          coinTransactions: {
            type: 'earn',
            amount,
            reason,
            date: new Date()
          }
        }
      }
    );

    // 2. Update monthly leaderboard
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    
    await db.collection('coin_leaderboard').updateOne(
      { userId: userId, month },
      {
        $inc: { totalCoinsEarned: amount, netCoins: amount },
        $set: {
          userName: user.name || user.fullName,
          userEmail: user.email,
          userPhone: user.phone || 'Not provided',
          userBank: user.bankName || 'Not provided',
          userAccountNumber: user.accountNumber || 'Not provided',
          userAccountName: user.accountName || 'Not provided',
          lastUpdated: new Date()
        },
        $setOnInsert: {
          userId,
          month,
          totalCoinsSpent: 0
        }
      },
      { upsert: true }
    );

    // 3. Get updated balance
    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    res.status(200).json({
      success: true,
      message: `✅ Earned ${amount} coins!`,
      newBalance: updatedUser.coins,
      reason
    });
  } catch (error) {
    console.error('Coin earn error:', error);
    res.status(500).json({ error: error.message });
  }
}
