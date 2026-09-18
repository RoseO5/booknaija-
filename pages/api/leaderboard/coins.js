import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    // Get current month (e.g., "2026-09")
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Fetch top 10 users for this month, sorted by netCoins descending
    const leaders = await db.collection('coin_leaderboard')
      .find({ month: currentMonth })
      .sort({ netCoins: -1 })
      .limit(10)
      .toArray();

    // Format the data
    const formattedLeaders = leaders.map((user, index) => ({
      rank: index + 1,
      name: user.userName || 'Anonymous',
      netCoins: user.netCoins || 0,
      // ⚠️ SECURE: Only expose sensitive data if requested by admin (we'll handle this in the admin tab)
      // For now, this public API only returns safe data.
    }));

    res.status(200).json({
      success: true,
      month: currentMonth,
      leaders: formattedLeaders
    });
  } catch (error) {
    console.error('Coin leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
}
