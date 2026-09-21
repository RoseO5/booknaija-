import clientPromise from '../../../lib/mongodb';

// Simple profanity/inappropriate word filter
const INAPPROPRIATE_WORDS = ['fuck', 'shit', 'bitch', 'ass', 'damn', 'whore', 'slut', 'nigger', 'faggot'];

function flagInappropriate(text) {
  const lower = text.toLowerCase();
  for (const word of INAPPROPRIATE_WORDS) {
    if (lower.includes(word)) return true;
  }
  // Flag if question is too short (less than 10 chars)
  if (text.trim().length < 10) return true;
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { authorEmail, authorName, bookId, bookTitle, questions } = req.body;
    if (!authorEmail || !bookId || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await clientPromise;
    const db = client.db('booknaija');

    // Process each question and flag if inappropriate
    const processedQuestions = questions.map(q => {
      const questionFlagged = flagInappropriate(q.question);
      const answerFlagged = flagInappropriate(q.answer);
      
      return {
        question: q.question,
        answer: q.answer,
        flagged: questionFlagged || answerFlagged,
        flagReason: (questionFlagged || answerFlagged) ? 'Inappropriate language or too short' : null,
        approved: !(questionFlagged || answerFlagged), // Auto-approve if not flagged
        submittedAt: new Date()
      };
    });

    // Count how many were flagged
    const flaggedCount = processedQuestions.filter(q => q.flagged).length;
    const approvedCount = processedQuestions.filter(q => q.approved).length;

    // Save to database (upsert - replace any existing questions for this book)
    await db.collection('book_trivia').updateOne(
      { bookId, authorEmail },
      {
        $set: {
          bookTitle,
          authorName,
          authorEmail,
          questions: processedQuestions,
          lastUpdated: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `✅ Submitted ${questions.length} questions. ${approvedCount} approved, ${flaggedCount} flagged for review.`,
      approvedCount,
      flaggedCount
    });
  } catch (error) {
    console.error('Submit questions error:', error);
    res.status(500).json({ error: error.message });
  }
}
