import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month required (format: YYYY-MM)' });

    const client = await clientPromise;
    const db = client.db('booknaija');

    const tournament = await db.collection('trivia_entries').findOne({ month });
    const config = await db.collection('trivia_config').findOne({ month });

    const now = new Date();
    const currentDay = now.getDate();
    const isOpen = currentDay >= 1 && currentDay <= 7;
    const isClosed = currentDay > 7;
    const daysLeft = isOpen ? 7 - currentDay : 0;

    const players = tournament?.players || [];
    const finishedPlayers = players.filter(p => p.finished);
    const pendingPlayers = players.filter(p => !p.finished);

    // AUTO-GRADE AND RANK: Highest score first, fastest time breaks ties
    const rankedPlayers = finishedPlayers
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.completionTime - b.completionTime;
      })
      .map((p, i) => ({ 
        rank: i + 1,
        userName: p.userName || 'Anonymous',
        userEmail: p.userEmail || 'No Email',
        score: p.score || 0,
        completionTime: p.completionTime || 0,
        userId: p.userId
      }));

    // EXACT BOOKNAIJA REVENUE MODEL SPLIT (Based on Total Entry Fees)
    const totalPool = tournament?.totalPoolNaira || 0;
    
    const platformProfit = Math.floor(totalPool * 0.40); // 40% to You
    const authorsShare = Math.floor(totalPool * 0.10);   // 10% to Featured Authors
    const winnersPool = Math.floor(totalPool * 0.50);    // 50% to Winners

    const prizes = {
      totalPool: totalPool,
      platformProfit: platformProfit,
      authorsShare: authorsShare,
      first: Math.floor(winnersPool * 0.50),   // 50% of the winners' pool
      second: Math.floor(winnersPool * 0.24),  // 24% of the winners' pool
      third: Math.floor(winnersPool * 0.16)    // 16% of the winners' pool
    };

    // Determine top 3 winners explicitly for the dashboard
    const winners = rankedPlayers.slice(0, 3).map((w, index) => ({
      ...w,
      prizeAmount: index === 0 ? prizes.first : index === 1 ? prizes.second : prizes.third
    }));

    res.status(200).json({
      tournament: {
        month,
        status: isClosed ? 'closed' : isOpen ? 'active' : 'upcoming',
        daysLeft,
        totalPlayers: players.length,
        finishedPlayers: finishedPlayers.length,
        pendingPlayers: pendingPlayers.length,
        totalPoolNaira: totalPool,
        prizes, // Now shows exact 40% platform, 10% authors, 50% winners breakdown
        winners,
        allRankedPlayers: rankedPlayers,
        pendingPlayersList: pendingPlayers.map(p => ({
          userId: p.userId,
          userName: p.userName || 'Anonymous',
          userEmail: p.userEmail || 'No Email',
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
