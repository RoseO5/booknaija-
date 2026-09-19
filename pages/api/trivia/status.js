import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month required (format: YYYY-MM)' });

    const client = await clientPromise;
    const db = client.db('booknaija');

    // Get current tournament
    const tournament = await db.collection('trivia_entries').findOne({ month });

    // Get featured books for this month (randomly selected from books with trivia questions)
    const allBooksWithTrivia = await db.collection('book_trivia').find({}).toArray();
    
    // Randomly pick 5 books (or all if less than 5)
    const shuffled = allBooksWithTrivia.sort(() => 0.5 - Math.random());
    const featuredBooks = shuffled.slice(0, 5).map(b => ({
      bookId: b.bookId,
      title: b.bookTitle,
      authorName: b.authorName,
      questionCount: b.questions.length
    }));

    // Calculate prize distribution
    const totalPool = tournament?.totalPoolNaira || 0;
    const prizes = {
      first: Math.floor(totalPool * 0.30),
      second: Math.floor(totalPool * 0.14),
      third: Math.floor(totalPool * 0.06),
      authors: Math.floor(totalPool * 0.10),
      platform: Math.floor(totalPool * 0.40)
    };

    res.status(200).json({
      tournament: {
        month,
        totalPlayers: tournament?.totalPlayers || 0,
        totalPoolNaira: totalPool,
        prizes,
        players: tournament?.players || []
      },
      featuredBooks
    });
  } catch (error) {
    console.error('Trivia status error:', error);
    res.status(500).json({ error: error.message });
  }
}
