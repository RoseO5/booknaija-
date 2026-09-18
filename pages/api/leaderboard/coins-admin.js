import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const { month } = req.query;
    const client = await clientPromise;
    const db = client.db('booknaija');

    // Fetch top 10 users for the requested month
    const leaders = await db.collection('coin_leaderboard')
      .find({ month: month })
      .sort({ netCoins: -1 })
      .limit(10)
      .toArray();

    res.status(200).json({
      success: true,
      leaders: leaders
    });
  } catch (error) {
    console.error('Admin coin leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
}
