import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const client = await clientPromise;
    const db = client.db('booknaija');

    // 1. Check if user is an author
    const author = await db.collection('authors').findOne({ email });
    if (!author) {
      return res.status(200).json({ isAuthor: false });
    }

    // ✅ PERMANENT FIX: Smart, flexible name matching
    // Cleans the name and creates a regex that matches the name even with extra words/spaces
    const cleanName = author.fullName.trim().replace(/\s+/g, ' ');
    const nameWords = cleanName.split(' ');
    // Creates a regex like /Rose.*Itimi/i which matches "Rose Itimi", "Rose Itimi Juvwetee", etc.
    const flexibleNameRegex = new RegExp(nameWords.join('.*'), 'i');

    // 2. Get author's books by matching email OR flexible name
    const books = await db.collection('books').find({
      $or: [
        { authorEmail: email },
        { authorName: flexibleNameRegex }
      ],
      status: 'published'
    }).toArray();

    const bookIds = books.map(b => b._id);

    // 3. Get reads for author's books
    const reads = await db.collection('reads').aggregate([
      { $match: { bookId: { $in: bookIds }, completed: true } },
      { $group: {
          _id: null,
          totalReads: { $sum: 1 },
          totalTime: { $sum: '$timeSpent' },
          uniqueReaders: { $addToSet: '$userId' }
      }}
    ]).toArray();

    const totalReads = reads[0]?.totalReads || 0;
    const totalTime = reads[0]?.totalTime || 0;
    const uniqueReaders = reads[0]?.uniqueReaders?.length || 0;

    // 4. Get platform-wide stats for calculation
    const allReads = await db.collection('reads').aggregate([
      { $match: { completed: true } },
      { $group: {
          _id: null,
          total: { $sum: 1 },
          totalTime: { $sum: '$timeSpent' },
          uniqueReaders: { $addToSet: '$userId' }
      }}
    ]).toArray();

    const platformTotalReads = allReads[0]?.total || 1;
    const platformTotalTime = allReads[0]?.totalTime || 1;
    const platformUniqueReaders = allReads[0]?.uniqueReaders?.length || 1;

    // 5. Calculate revenue
    const activeSubscriptions = await db.collection('users').countDocuments({
      role: 'reader',
      'subscription.active': true
    });

    const estimatedRevenue = activeSubscriptions * 1000;
    const authorPool = Math.floor(estimatedRevenue * 0.5);

    // 6. Calculate author's share (with safe division by zero checks)
    const minutesShare = platformTotalTime > 0 ? (totalTime / platformTotalTime) * 0.7 : 0;
    const readersShare = platformUniqueReaders > 0 ? (uniqueReaders / platformUniqueReaders) * 0.3 : 0;
    const totalShare = minutesShare + readersShare;
    const earnings = Math.floor(authorPool * totalShare);

    res.status(200).json({
      isAuthor: true,
      author: {
        name: author.fullName,
        email: author.email,
        bank: author.bankName,
        account: author.accountNumber,
        accountName: author.accountName
      },
      stats: {
        books: books.length,
        reads: totalReads,
        minutes: Math.floor(totalTime / 60),
        uniqueReaders
      },
      breakdown: {
        minutesShare: (minutesShare * 100).toFixed(2),
        readersShare: (readersShare * 100).toFixed(2),
        totalShare: (totalShare * 100).toFixed(2)
      },
      earnings
    });
  } catch (error) {
    console.error('Author earnings error:', error);
    res.status(500).json({ error: error.message });
  }
}
