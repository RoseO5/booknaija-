import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { action, selectedBooks } = req.body;
    // action: 'start' | 'stop' | 'override'
    // selectedBooks: array of book objects (if overriding)

    const client = await clientPromise;
    const db = client.db('booknaija');
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (action === 'start') {
      // Start the tournament
      let featuredBooks = selectedBooks;
      
      // If no manual selection, auto-select top 5
      if (!featuredBooks || featuredBooks.length === 0) {
        const allTrivia = await db.collection('book_trivia').find({}).toArray();
        const booksByQuality = allTrivia
          .map(b => ({
            bookId: b.bookId,
            bookTitle: b.bookTitle,
            authorName: b.authorName,
            authorEmail: b.authorEmail,
            questionCount: b.questions.filter(q => q.approved).length
          }))
          .filter(b => b.questionCount > 0)
          .sort((a, b) => b.questionCount - a.questionCount);
        
        featuredBooks = booksByQuality.slice(0, 5);
      }

      // Save config
      await db.collection('trivia_config').updateOne(
        { month: currentMonth },
        {
          $set: {
            featuredBooks,
            launchedAt: now,
            launchedBy: 'admin'
          }
        },
        { upsert: true }
      );

      // Initialize tournament
      await db.collection('trivia_entries').updateOne(
        { month: currentMonth },
        {
          $set: {
            status: 'active',
            startedAt: now,
            endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          },
          $setOnInsert: {
            totalPlayers: 0,
            totalPoolNaira: 0,
            players: []
          }
        },
        { upsert: true }
      );

      res.status(200).json({
        success: true,
        message: `🚀 Tournament started! Featured ${featuredBooks.length} books. Ends in 7 days.`,
        featuredBooks
      });

    } else if (action === 'stop') {
      // Stop the tournament early
      await db.collection('trivia_entries').updateOne(
        { month: currentMonth },
        {
          $set: {
            status: 'closed',
            endedAt: now
          }
        }
      );

      res.status(200).json({
        success: true,
        message: '🔴 Tournament closed early by admin.'
      });

    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Admin launch error:', error);
    res.status(500).json({ error: error.message });
  }
}
