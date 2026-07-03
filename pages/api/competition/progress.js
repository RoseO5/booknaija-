import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get all active readers with their stats
    const readers = await db.collection('users').aggregate([
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
            { $group: {
                _id: null,
                booksRead: { $sum: 1 },
                totalTime: { $sum: '$timeSpent' },
                lastRead: { $max: '$lastReadAt' }
            }}
          ],
          as: 'readingStats'
      }},
      { $unwind: { path: '$readingStats', preserveNullAndEmptyArrays: true } },
      { $project: {
          name: 1,
          email: 1,
          booksRead: { $ifNull: ['$readingStats.booksRead', 0] },
          totalTime: { $ifNull: ['$readingStats.totalTime', 0] },
          lastRead: '$readingStats.lastRead'
      }},
      { $sort: { booksRead: -1 } }
    ]).toArray();

    // Categorize readers
    const qualified = readers.filter(r => r.booksRead >= 50);
    const nearlyQualified = readers.filter(r => r.booksRead >= 40 && r.booksRead < 50);
    const progressing = readers.filter(r => r.booksRead >= 20 && r.booksRead < 40);
    const beginners = readers.filter(r => r.booksRead < 20);

    res.status(200).json({
      success: true,
      totalReaders: readers.length,
      categories: {
        qualified: {
          count: qualified.length,
          readers: qualified.map(r => ({
            name: r.name,
            booksRead: r.booksRead,
            progress: '100%',
            status: '✅ Qualified for Prize'
          }))
        },
        nearlyQualified: {
          count: nearlyQualified.length,
          readers: nearlyQualified.map(r => ({
            name: r.name,
            booksRead: r.booksRead,
            progress: `${Math.round((r.booksRead / 50) * 100)}%`,
            status: '🔥 Almost there!'
          }))
        },
        progressing: {
          count: progressing.length,
          readers: progressing.map(r => ({
            name: r.name,
            booksRead: r.booksRead,
            progress: `${Math.round((r.booksRead / 50) * 100)}%`,
            status: '📈 Making progress'
          }))
        },
        beginners: {
          count: beginners.length,
          readers: beginners.slice(0, 10).map(r => ({
            name: r.name,
            booksRead: r.booksRead,
            progress: `${Math.round((r.booksRead / 50) * 100)}%`,
            status: '🌱 Just started'
          }))
        }
      },
      prizeDrawInfo: {
        qualifiedCount: qualified.length,
        canDraw: qualified.length >= 3,
        drawMethod: qualified.length > 4 
          ? 'Top 3 by books read + 1 random from remaining qualified'
          : 'All qualified readers win (if 3-4 qualified)',
        nextDraw: qualified.length >= 3 ? 'Ready to draw!' : `${Math.max(0, 3 - qualified.length)} more needed`
      }
    });
  } catch (error) {
    console.error('Progress error:', error);
    res.status(500).json({ error: error.message });
  }
}
