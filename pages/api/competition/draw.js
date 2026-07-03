import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get all qualified readers (50+ books)
    const qualified = await db.collection('users').aggregate([
      { $match: { role: 'reader', 'subscription.active': true } },
      { $lookup: {
          from: 'reads',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { 
                $expr: { $eq: ['$userId', '$$userId'] },
                completed: true,
                lastReadAt: { $gte: sixMonthsAgo }
            }},
            { $count: 'booksRead' }
          ],
          as: 'stats'
      }},
      { $unwind: { path: '$stats', preserveNullAndEmptyArrays: true } },
      { $match: { 'stats.booksRead': { $gte: 50 } } },
      { $project: {
          name: 1,
          email: 1,
          booksRead: '$stats.booksRead'
      }},
      { $sort: { booksRead: -1 } }
    ]).toArray();

    if (qualified.length < 3) {
      return res.status(400).json({
        error: 'Not enough qualified readers',
        message: `Need at least 3 qualified readers, currently have ${qualified.length}`
      });
    }

    // Fair draw logic
    let winners = [];
    
    if (qualified.length <= 4) {
      // If 3-4 qualified, all win
      winners = qualified.map((r, i) => ({
        rank: i + 1,
        name: r.name,
        email: r.email,
        booksRead: r.booksRead,
        prize: i < 3 ? 5000 : 0 // Top 3 get ₦5000 each
      }));
    } else {
      // If 5+ qualified: Top 3 by books read + 1 random from rest
      const top3 = qualified.slice(0, 3);
      const remaining = qualified.slice(3);
      
      // Random selection from remaining
      const randomWinner = remaining[Math.floor(Math.random() * remaining.length)];
      
      winners = [
        ...top3.map((r, i) => ({
          rank: i + 1,
          name: r.name,
          email: r.email,
          booksRead: r.booksRead,
          prize: 5000,
          selectionMethod: 'Top 3 by books read'
        })),
        {
          rank: 4,
          name: randomWinner.name,
          email: randomWinner.email,
          booksRead: randomWinner.booksRead,
          prize: 5000,
          selectionMethod: 'Random from qualified readers'
        }
      ];
    }

    // Record the draw
    await db.collection('prize_draws').insertOne({
      drawDate: new Date(),
      winners: winners.map(w => ({
        name: w.name,
        email: w.email,
        booksRead: w.booksRead,
        prize: w.prize
      })),
      totalQualified: qualified.length,
      method: qualified.length <= 4 ? 'All qualified win' : 'Top 3 + 1 random'
    });

    res.status(200).json({
      success: true,
      drawDate: new Date().toISOString(),
      totalQualified: qualified.length,
      method: qualified.length <= 4 ? 'All qualified readers win' : 'Top 3 by books + 1 random',
      winners
    });
  } catch (error) {
    console.error('Draw error:', error);
    res.status(500).json({ error: error.message });
  }
}
