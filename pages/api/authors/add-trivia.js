import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { authorEmail, bookId, questions } = req.body;
    if (!authorEmail || !bookId || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'authorEmail, bookId, and questions array required' });
    }

    const client = await clientPromise;
    const db = client.db('booknaija');

    // Find the author to get their full name for flexible matching
    const author = await db.collection('authors').findOne({ 
      email: { $regex: new RegExp(`^${authorEmail}$`, 'i') } 
    });

    if (!author) {
      return res.status(403).json({ error: 'Author not found' });
    }

    // Flexible name matching
    const cleanName = author.fullName.trim().replace(/\s+/g, ' ');
    const nameWords = cleanName.split(' ');
    const flexibleNameRegex = new RegExp(nameWords.join('.*'), 'i');

    // Verify the author owns this book (flexible matching)
    const book = await db.collection('books').findOne({
      _id: new ObjectId(bookId),
      $or: [
        { authorEmail: author.email },
        { authorName: flexibleNameRegex }
      ]
    });

    if (!book) {
      return res.status(403).json({ error: 'You do not own this book' });
    }

    // Store the trivia questions
    await db.collection('book_trivia').updateOne(
      { bookId: bookId },
      {
        $set: {
          bookId: bookId,
          bookTitle: book.title,
          authorEmail: author.email,
          authorName: author.fullName,
          questions: questions,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `✅ Successfully added ${questions.length} trivia questions for "${book.title}"`
    });
  } catch (error) {
    console.error('Add trivia error:', error);
    res.status(500).json({ error: error.message });
  }
}
