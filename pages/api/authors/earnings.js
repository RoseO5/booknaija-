import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const client = await clientPromise;
    const db = client.db('booknaija');

    // 1. Find Author (Case-insensitive)
    let author = await db.collection('authors').findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });

    if (!author) return res.status(404).json({ error: 'Author not found' });

    // 2. Find Books (Flexible name matching)
    const cleanName = author.fullName.trim().replace(/\s+/g, ' ');
    const nameWords = cleanName.split(' ');
    const flexibleNameRegex = new RegExp(nameWords.join('.*'), 'i');

    const books = await db.collection('books').find({
      $or: [
        { authorEmail: author.email },
        { authorName: flexibleNameRegex }
      ]
    }).sort({ createdAt: -1 }).toArray();

    // CRITICAL: Keep IDs as ObjectIds for accurate read matching
    const bookIds = books.map(b => b._id);

    // 3. Calculate Earnings (100% time-based)
    let totalTimeSpent = 0;
    let totalReads = 0;
    
    if (bookIds.length > 0) {
      const readsAgg = await db.collection('reads').aggregate([
        { $match: { bookId: { $in: bookIds }, completed: true } },
        { $group: { _id: null, totalReads: { $sum: 1 }, totalTime: { $sum: '$timeSpent' } } }
      ]).toArray();

      if (readsAgg.length > 0) {
        totalTimeSpent = readsAgg[0].totalTime;
        totalReads = readsAgg[0].totalReads;
      }
    }

    const platformAgg = await db.collection('reads').aggregate([
      { $match: { completed: true } },
      { $group: { _id: null, total: { $sum: '$timeSpent' } } }
    ]).toArray();

    const platformTotalTime = platformAgg.length > 0 ? platformAgg[0].total : 0;

    let readingEarnings = 0;
    if (totalTimeSpent > 0 && platformTotalTime > 0) {
      const activeSubscribers = await db.collection('users').countDocuments({ 'subscription.active': true });
      const monthlyRevenue = activeSubscribers * 1000;
      const authorPool = monthlyRevenue * 0.5;
      readingEarnings = Math.round((totalTimeSpent / platformTotalTime) * authorPool);
    }

    // Other earnings (These reset to 0 when Admin clicks "Mark as Paid")
    const coinUnlockEarnings = author.earnings?.coinUnlocks || 0;
    const tipEarnings = author.earnings?.tips || 0;
    const triviaEarnings = author.earnings?.trivia || 0;
    const totalEarnings = readingEarnings + coinUnlockEarnings + tipEarnings + triviaEarnings;

    // Format books list for frontend
    const booksList = books.map(b => ({
      title: b.title,
      genre: b.genre || 'General',
      status: b.status || 'pending',
      createdAt: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-GB') : 'Recently'
    }));

    // Response
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
        totalReads: totalReads,
        totalTimeSpent: totalTimeSpent
      },
      booksList: booksList,
      earnings: {
        fromReading: readingEarnings,
        fromCoinUnlocks: coinUnlockEarnings,
        fromTips: tipEarnings,
        fromTrivia: triviaEarnings,
        total: totalEarnings
      }
    });
  } catch (error) {
    console.error('Author earnings error:', error);
    res.status(500).json({ error: error.message });
  }
}
