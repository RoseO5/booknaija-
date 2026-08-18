import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { month } = req.body;
    const client = await clientPromise;
    const db = client.db('booknaija');

    // 1. Get 6 months ago date (current cycle)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 2. 🛡️ ANTI-CHEAT: Aggregate directly from the VERIFIED 'reads' collection
    // This ensures we only count books where completed: true (verified 5+ mins in secure reader)
    const eligibleReadersAgg = await db.collection('reads').aggregate([
      { $match: { 
          completed: true, 
          lastReadAt: { $gte: sixMonthsAgo } 
      }},
      { $group: {
          _id: '$userId',
          uniqueBooksRead: { $sum: 1 },
          totalMinutes: { $sum: { $divide: ['$timeSpent', 60] } }
      }},
      { $match: { uniqueBooksRead: { $gte: 50 } } }, // Only those who read 50+ books
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
      }},
      { $unwind: '$user' },
      { $match: { 
          'user.role': 'reader',
          'user.subscription.active': true 
      }},
      { $project: {
          _id: '$user._id',
          name: '$user.name',
          email: '$user.email',
          phone: '$user.phone',
          uniqueBooksRead: 1,
          totalMinutes: { $round: ['$totalMinutes', 0] }
      }},
      { $sort: { uniqueBooksRead: -1, totalMinutes: -1 } }
    ]).toArray();

    if (eligibleReadersAgg.length === 0) {
      return res.status(400).json({
        error: 'No eligible readers found',
        message: 'Need at least 1 reader with 50+ verified books read to conduct prize draw'
      });
    }

    // 3. Get top 3 readers
    const winners = eligibleReadersAgg.slice(0, Math.min(3, eligibleReadersAgg.length));

    // 4. Record prize payouts
    const currentMonth = month || new Date().toISOString().slice(0, 7);
    for (const winner of winners) {
      await db.collection('payouts').insertOne({
        type: 'prize',
        recipientId: winner._id,
        recipientPhone: winner.phone,
        recipientName: winner.name,
        amount: 5000,
        month: currentMonth,
        status: 'pending',
        createdAt: new Date(),
        notes: '6-month verified prize draw winner'
      });
    }

    res.status(200).json({
      success: true,
      month: currentMonth,
      totalEligible: eligibleReadersAgg.length,
      winners: winners.map((w, i) => ({
        rank: i + 1,
        name: w.name,
        email: w.email,
        phone: w.phone,
        uniqueBooksRead: w.uniqueBooksRead,
        totalMinutes: w.totalMinutes,
        prize: 5000
      })),
      message: `🎉 Prize draw completed! ${winners.length} verified winners selected.`
    });
  } catch (error) {
    console.error('Prize draw error:', error);
    res.status(500).json({ error: 'Failed to conduct prize draw', details: error.message });
  }
}
