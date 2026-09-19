import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month required (format: YYYY-MM)' });

    const client = await clientPromise;
    const db = client.db('booknaija');

    // Get tournament data
    const tournament = await db.collection('trivia_entries').findOne({ month });
    
    // Get featured books config
    const config = await db.collection('trivia_config').findOne({ month });

    // Calculate tournament status
    const now = new Date();
    const currentDay = now.getDate();
    const isOpen = currentDay >= 1 && currentDay <= 7;
    const isClosed = currentDay > 7;
    const daysLeft = isOpen ? 7 - currentDay : 0;

    // Process players
    const players = tournament?.players || [];
    const finishedPlayers = players.filter(p => p.finished);
    const pendingPlayers = players.filter(p => !p.finished);
    
    // Rank finished players
    const rankedPlayers = finishedPlayers
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.completionTime - b.completionTime;
      })
      .map((p, i) => ({ ...p, rank: i + 1 }));

    // Calculate prizes
    const totalPool = tournament?.totalPoolNaira || 0;
    const prizes = {
      first: Math.floor(totalPool * 0.30),
      second: Math.floor(totalPool * 0.14),
      third: Math.floor(totalPool * 0.06),
      authors: Math.floor(totalPool * 0.10),
      platform: Math.floor(totalPool * 0.40)
    };

    // Determine winners (top 3)
    const winners = rankedPlayers.slice(0, 3);

    res.status(200).json({
      tournament: {
        month,
        status: isClosed ? 'closed' : isOpen ? 'active' : 'upcoming',
        daysLeft,
        totalPlayers: players.length,
        finishedPlayers: finishedPlayers.length,
        pendingPlayers: pendingPlayers.length,
        totalPoolNaira: totalPool,
        prizes,
        winners,
        allRankedPlayers: rankedPlayers,
        pendingPlayersList: pendingPlayers.map(p => ({
          userId: p.userId,
          userName: p.userName,
          userEmail: p.userEmail,
          enteredAt: p.enteredAt
        }))
      },
      featuredBooks: config?.featuredBooks || [],
      instructions: {
        today: isClosed 
          ? 'Tournament is closed. Announce winners and make payouts!'
          : isOpen 
            ? `Tournament is active! ${daysLeft} day(s) left for players to enter and complete the quiz.`
            : 'Tournament has not started yet. It opens on the 1st of the month.'
      }
    });
  } catch (error) {
    console.error('Admin trivia error:', error);
    res.status(500).json({ error: error.message });
  }
}
