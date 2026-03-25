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

    // Get eligible readers (50+ UNIQUE books read)
    const eligibleReaders = await db.collection('users')
      .find({
        role: 'reader',
        'subscription.active': true,
        'stats.uniqueBooksRead': { $gte: 50 },
        'stats.eligibleForPrize': true
      })
      .sort({ 'stats.uniqueBooksRead': -1, 'stats.totalMinutes': -1 })
      .toArray();

    if (eligibleReaders.length === 0) {
      return res.status(400).json({ 
        error: 'No eligible readers found',
        message: 'Need at least 3 readers with 50+ UNIQUE books read to conduct prize draw' 
      });
    }

    // Get top 3 readers
    const winners = eligibleReaders.slice(0, Math.min(3, eligibleReaders.length));

    // Record prize payouts
    for (const winner of winners) {
      await db.collection('payouts').insertOne({
        type: 'prize',
        recipientId: winner._id,
        recipientPhone: winner.phone,
        recipientName: winner.name,
        amount: 5000,
        month: month || new Date().toISOString().slice(0, 7),
        status: 'pending',
        createdAt: new Date(),
        notes: '6-month prize draw winner'
      });
    }

    res.status(200).json({ 
      success: true, 
      month: month || new Date().toISOString().slice(0, 7),
      totalEligible: eligibleReaders.length,
      winners: winners.map((w, i) => ({
        rank: i + 1,
        name: w.name,
        email: w.email,
        phone: w.phone,
        uniqueBooksRead: w.stats.uniqueBooksRead,
        totalMinutes: w.stats.totalMinutes,
        prize: 5000
      })),
      message: `🎉 Prize draw completed! ${winners.length} winners selected.`
    });
  } catch (error) {
    console.error('Prize draw error:', error);
    res.status(500).json({ error: 'Failed to conduct prize draw', details: error.message });
  }
}
