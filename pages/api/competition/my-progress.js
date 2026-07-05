import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const client = await clientPromise;
    const db = client.db('booknaija');

    // Find user
    const user = await db.collection('users').findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get 6 months ago date (current cycle)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get user's reading stats
    const stats = await db.collection('reads').aggregate([
      { $match: { 
          userId: user._id, 
          completed: true,
          lastReadAt: { $gte: sixMonthsAgo }
      }},
      { $group: {
          _id: null,
          booksRead: { $sum: 1 },
          totalTime: { $sum: '$timeSpent' }
      }}
    ]).toArray();

    const booksRead = stats[0]?.booksRead || 0;
    const totalMinutes = Math.floor((stats[0]?.totalTime || 0) / 60);

    res.status(200).json({
      success: true,
      booksRead,
      totalMinutes,
      qualified: booksRead >= 50,
      progress: `${booksRead}/50`
    });
  } catch (error) {
    console.error('My progress error:', error);
    res.status(500).json({ error: error.message });
  }
}
