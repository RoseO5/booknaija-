import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const client = await clientPromise;
    const db = client.db('booknaija');

    // 1. Find the author to get their full name for flexible matching
    const author = await db.collection('authors').findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });

    if (!author) {
      return res.status(200).json({ books: [] });
    }

    // 2. Flexible name matching (exactly like the earnings dashboard)
    const cleanName = author.fullName.trim().replace(/\s+/g, ' ');
    const nameWords = cleanName.split(' ');
    const flexibleNameRegex = new RegExp(nameWords.join('.*'), 'i');

    // Get ALL books by this author (no status filter)
    const books = await db.collection('books').find({
      $or: [
        { authorEmail: author.email },
        { authorName: flexibleNameRegex }
      ]
    }).project({
      _id: 1,
      title: 1,
      genre: 1,
      createdAt: 1
    }).sort({ createdAt: -1 }).toArray();

    const bookIds = books.map(b => b._id.toString());
    
    // 3. Count trivia questions for these books
    const triviaRecords = await db.collection('book_trivia').find({
      bookId: { $in: bookIds }
    }).toArray();

    const triviaMap = {};
    triviaRecords.forEach(t => {
      triviaMap[t.bookId] = t.questions ? t.questions.length : 0;
    });

    const booksWithStatus = books.map(b => ({
      _id: b._id.toString(),
      title: b.title,
      genre: b.genre || 'General',
      triviaCount: triviaMap[b._id.toString()] || 0
    }));

    res.status(200).json({ books: booksWithStatus });
  } catch (error) {
    console.error('Get books for trivia error:', error);
    res.status(500).json({ error: error.message });
  }
}
