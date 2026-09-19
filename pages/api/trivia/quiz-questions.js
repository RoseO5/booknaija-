import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const { month, userId } = req.query;
    if (!month || !userId) return res.status(400).json({ error: 'month and userId required' });

    const client = await clientPromise;
    const db = client.db('booknaija');

    // Check if user has entered
    const tournament = await db.collection('trivia_entries').findOne({ month });
    if (!tournament) {
      return res.status(200).json({ hasEntered: false, questions: [] });
    }

    const playerEntry = tournament.players?.find(p => p.userId === userId);
    if (!playerEntry) {
      return res.status(200).json({ hasEntered: false, questions: [] });
    }

    // Check if already completed
    if (playerEntry.finished) {
      return res.status(200).json({ 
        hasEntered: true, 
        alreadyCompleted: true,
        previousScore: playerEntry.score,
        questions: [] 
      });
    }

    // Get featured books for this month
    const config = await db.collection('trivia_config').findOne({ month });
    if (!config || !config.featuredBooks || config.featuredBooks.length === 0) {
      return res.status(200).json({ 
        hasEntered: true, 
        alreadyCompleted: false,
        questions: [],
        noQuestionsAvailable: true
      });
    }

    // Get all questions from featured books
    const bookIds = config.featuredBooks.map(b => b.bookId);
    const triviaRecords = await db.collection('book_trivia').find({
      bookId: { $in: bookIds }
    }).toArray();

    // Flatten all questions and assign unique IDs
    let allQuestions = [];
    triviaRecords.forEach(record => {
      record.questions.forEach((q, index) => {
        allQuestions.push({
          id: `${record.bookId}_${index}`,
          question: q.question,
          bookTitle: record.bookTitle,
          authorName: record.authorName
        });
      });
    });

    // Shuffle and take up to 20
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 20);

    res.status(200).json({
      hasEntered: true,
      alreadyCompleted: false,
      questions: selectedQuestions,
      totalQuestions: selectedQuestions.length
    });
  } catch (error) {
    console.error('Quiz questions error:', error);
    res.status(500).json({ error: error.message });
  }
}
