import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { userId, answers, completionTime } = req.body;
    if (!userId || !answers) return res.status(400).json({ error: 'userId and answers required' });

    const client = await clientPromise;
    const db = client.db('booknaija');
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get the tournament
    const tournament = await db.collection('trivia_entries').findOne({ month: currentMonth });
    if (!tournament) {
      return res.status(400).json({ error: 'No tournament found for this month' });
    }

    // Check if user has entered
    const playerIndex = tournament.players?.findIndex(p => p.userId === userId);
    if (playerIndex === -1 || playerIndex === undefined) {
      return res.status(400).json({ error: 'You have not entered this tournament' });
    }

    const player = tournament.players[playerIndex];
    if (player.finished) {
      return res.status(400).json({ error: 'You have already completed this quiz' });
    }

    // Get featured books and their questions WITH answers
    const config = await db.collection('trivia_config').findOne({ month: currentMonth });
    if (!config) {
      return res.status(400).json({ error: 'No trivia config found' });
    }

    const bookIds = config.featuredBooks.map(b => b.bookId);
    const triviaRecords = await db.collection('book_trivia').find({
      bookId: { $in: bookIds }
    }).toArray();

    // Build answer key
    const answerKey = {};
    triviaRecords.forEach(record => {
      record.questions.forEach((q, index) => {
        const questionId = `${record.bookId}_${index}`;
        answerKey[questionId] = q.answer;
      });
    });

    // Score the answers (case-insensitive, trimmed)
    const normalize = (s) => (s || '').toString().trim().toLowerCase();
    let score = 0;
    answers.forEach(a => {
      const correctAnswer = answerKey[a.questionId];
      if (correctAnswer && normalize(a.answer) === normalize(correctAnswer)) {
        score++;
      }
    });

    // Update player's score and mark as finished
    const updateKey = `players.${playerIndex}`;
    await db.collection('trivia_entries').updateOne(
      { month: currentMonth },
      {
        $set: {
          [`${updateKey}.score`]: score,
          [`${updateKey}.completionTime`]: completionTime,
          [`${updateKey}.finished`]: true,
          [`${updateKey}.finishedAt`]: now
        }
      }
    );

    // Calculate rank
    const updatedTournament = await db.collection('trivia_entries').findOne({ month: currentMonth });
    const finishedPlayers = updatedTournament.players
      .filter(p => p.finished)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.completionTime - b.completionTime;
      });

    const rank = finishedPlayers.findIndex(p => p.userId === userId) + 1;

    res.status(200).json({
      success: true,
      score,
      totalQuestions: Object.keys(answerKey).length,
      rank,
      totalFinished: finishedPlayers.length
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    res.status(500).json({ error: error.message });
  }
}
