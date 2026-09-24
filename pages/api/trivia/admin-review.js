import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    const allTrivia = await db.collection('book_trivia').find({}).toArray();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const config = await db.collection('trivia_config').findOne({ month: currentMonth });
    const tournament = await db.collection('trivia_entries').findOne({ month: currentMonth });

    const booksByQuality = allTrivia.map(b => ({
      bookId: b.bookId,
      bookTitle: b.bookTitle,
      authorName: b.authorName,
      authorEmail: b.authorEmail,
      totalQuestions: b.questions.length,
      approvedQuestions: b.questions.filter((q: any) => q.approved).length,
      flaggedQuestions: b.questions.filter((q: any) => q.flagged).length,
      questions: b.questions // 🔥 ADDED: Send actual questions for manual review
    })).sort((a: any, b: any) => b.approvedQuestions - a.approvedQuestions);

    res.status(200).json({
      success: true,
      month: currentMonth,
      stats: {
        totalBooks: allTrivia.length,
        totalQuestions: allTrivia.reduce((sum: number, b: any) => sum + b.questions.length, 0),
        approvedQuestions: booksByQuality.reduce((sum: number, b: any) => sum + b.approvedQuestions, 0),
        flaggedQuestions: booksByQuality.reduce((sum: number, b: any) => sum + b.flaggedQuestions, 0)
      },
      allBooks: booksByQuality,
      autoSelected: booksByQuality.slice(0, 5),
      currentConfig: config,
      tournament: tournament ? { status: tournament.status || 'pending', totalPlayers: tournament.totalPlayers || 0 } : null
    });
  } catch (error) {
    console.error('Admin review error:', error);
    res.status(500).json({ error: error.message });
  }
}
