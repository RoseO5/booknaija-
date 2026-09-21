import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    // Get all books with trivia questions
    const allTrivia = await db.collection('book_trivia').find({}).toArray();

    // Get current month's config (if exists)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const config = await db.collection('trivia_config').findOne({ month: currentMonth });

    // Get tournament status
    const tournament = await db.collection('trivia_entries').findOne({ month: currentMonth });

    // Calculate stats
    const totalBooks = allTrivia.length;
    const totalQuestions = allTrivia.reduce((sum, b) => sum + b.questions.length, 0);
    const flaggedQuestions = allTrivia.reduce((sum, b) => sum + b.questions.filter(q => q.flagged).length, 0);
    const approvedQuestions = totalQuestions - flaggedQuestions;

    // Auto-select top 5 books (most approved questions)
    const booksByQuality = allTrivia
      .map(b => ({
        bookId: b.bookId,
        bookTitle: b.bookTitle,
        authorName: b.authorName,
        authorEmail: b.authorEmail,
        totalQuestions: b.questions.length,
        approvedQuestions: b.questions.filter(q => q.approved).length,
        flaggedQuestions: b.questions.filter(q => q.flagged).length
      }))
      .sort((a, b) => b.approvedQuestions - a.approvedQuestions);

    const autoSelected = booksByQuality.slice(0, 5);

    res.status(200).json({
      success: true,
      month: currentMonth,
      stats: {
        totalBooks,
        totalQuestions,
        approvedQuestions,
        flaggedQuestions
      },
      allBooks: booksByQuality,
      autoSelected,
      currentConfig: config,
      tournament: tournament ? {
        status: tournament.status || 'pending',
        totalPlayers: tournament.totalPlayers || 0,
        startedAt: tournament.startedAt,
        endedAt: tournament.endedAt
      } : null
    });
  } catch (error) {
    console.error('Admin review error:', error);
    res.status(500).json({ error: error.message });
  }
}
