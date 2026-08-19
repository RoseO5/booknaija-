import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    // 1. Get all users
    const users = await db.collection('users').find({}).toArray();

    // 2. Get verified reading stats (only completed books count)
    const readStats = await db.collection('reads').aggregate([
      { $match: { completed: true } },
      { $group: {
          _id: '$userId',
          booksRead: { $sum: 1 },
          totalTime: { $sum: '$timeSpent' }
        }}
    ]).toArray();

    // 3. Map stats to a dictionary for quick lookup
    const statsMap = {};
    readStats.forEach(stat => {
      statsMap[stat._id.toString()] = {
        booksRead: stat.booksRead,
        totalMinutes: Math.floor(stat.totalTime / 60)
      };
    });

    // 4. Combine user data with stats
    const readersList = users.map(user => {
      const userIdStr = user._id.toString();
      const stats = statsMap[userIdStr] || { booksRead: 0, totalMinutes: 0 };
      return {
        id: userIdStr,
        name: user.name || 'Unknown',
        email: user.email,
        phone: user.phone || 'Not provided',
        role: user.role || 'reader',
        isSubscribed: user.subscription?.active || false,
        booksRead: stats.booksRead,
        totalMinutes: stats.totalMinutes,
        joinedAt: user.createdAt
      };
    });

    // Sort by most active readers first
    readersList.sort((a, b) => b.booksRead - a.booksRead);

    res.status(200).json({ success: true, readers: readersList });
  } catch (error) {
    console.error('Readers API error:', error);
    res.status(500).json({ error: error.message });
  }
}
