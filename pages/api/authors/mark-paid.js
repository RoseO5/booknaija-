import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { authorEmail, amount, breakdown, notes } = req.body;

    if (!authorEmail || !amount) {
      return res.status(400).json({ error: 'Author email and amount required' });
    }

    const client = await clientPromise;
    const db = client.db('booknaija');

    // Get current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Check if already paid this month
    const existingPayout = await db.collection('payouts').findOne({
      authorEmail,
      month: currentMonth
    });

    if (existingPayout) {
      return res.status(400).json({
        error: `This author was already paid ₦${existingPayout.amount} on ${new Date(existingPayout.paidAt).toLocaleDateString()}`
      });
    }

    // Record the payout
    const payoutRecord = {
      authorEmail,
      month: currentMonth,
      amount: Number(amount),
      breakdown: breakdown || { reading: 0, unlocks: 0, tips: 0, trivia: 0 },
      notes: notes || '',
      paidAt: now,
      paidBy: 'admin'
    };

    await db.collection('payouts').insertOne(payoutRecord);

    // 🔥 BULLETPROOF FIX: Overwrite the entire 'earnings' object to prevent array/type errors
    await db.collection('authors').updateOne(
      { email: authorEmail },
      {
        $set: {
          earnings: {
            tips: 0,
            coinUnlocks: 0,
            trivia: 0
          },
          lastPayoutAt: now,
          lastPayoutAmount: Number(amount)
        }
      }
    );

    res.status(200).json({
      success: true,
      message: `✅ Successfully paid ₦${amount} to ${authorEmail}`,
      payout: payoutRecord
    });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ error: error.message });
  }
}
