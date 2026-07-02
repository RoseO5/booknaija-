import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    // Get 6 months ago date
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Aggregate: count completed books per user in last 6 months
    const leaderboard = await db.collection('reads').aggregate([
      { $match: { completed: true, lastReadAt: { $gte: sixMonthsAgo } } },
      { $group: { 
          _id: '$userId', 
          booksRead: { $sum: 1 }, 
          lastRead: { $max: '$lastReadAt' } 
        }},
      { $lookup: { 
          from: 'users', 
          let: { userId: '$_id' }, 
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
            { $project: { name: 1, email: 1 } }
          ],
          as: 'user' 
        }},
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { 
          name: { $ifNull: ['$user.name', 'Anonymous Reader'] }, 
          email: '$user.email',
          booksRead: 1, 
          lastRead: 1 
        }},
      { $sort: { booksRead: -1 } },
      { $limit: 50 }
    ]).toArray();

    res.status(200).json({ 
      success: true, 
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        name: entry.name,
        booksRead: entry.booksRead,
        qualified: entry.booksRead >= 50,
        lastRead: entry.lastRead
      })),
      prizeAmount: 5000,
      currency: 'NGN',
      requirement: '50 books in 6 months'
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
}
