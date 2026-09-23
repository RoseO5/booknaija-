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

    // 2. Get author's books by matching email OR flexible name
    const cleanName = author.fullName.trim().replace(/\s+/g, ' ');
    const nameWords = cleanName.split(' ');
    const flexibleNameRegex = new RegExp(nameWords.join('.*'), 'i');

    const books = await db.collection('books').find({
      $or: [
        { authorEmail: email },
        { authorName: flexibleNameRegex }
      ]
    }).sort({ createdAt: -1 }).toArray(); // Sort newest first

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

    // 6. Calculate author's share from reading (MATCHES ADMIN DASHBOARD EXACTLY)
    // Only count COMPLETED reads for accurate earnings
    const authorReadsAgg = await db.collection('reads').aggregate([
      { $match: { 
          userEmail: author.email, 
          completed: true 
        } 
      },
      { $group: { _id: null, totalTime: { $sum: '$timeSpent' } } }
    ]).toArray();
    
    const totalTimeSpent = authorReadsAgg.length > 0 ? authorReadsAgg[0].totalTime : 0;

    const platformAgg = await db.collection('reads').aggregate([
      { $match: { completed: true } },
      { $group: { _id: null, total: { $sum: '$timeSpent' } } }
    ]).toArray();

    let readingEarnings = 0;
    if (totalTimeSpent > 0 && platformTotalTime > 0) {
    if (totalTimeSpent > 0 && platformTotalTime > 0) {
      const activeSubscribers = await db.collection('users').countDocuments({
        'subscription.active': true
      });
      const monthlyRevenue = activeSubscribers * 1000; // ₦1000 per subscriber
      const authorPool = monthlyRevenue * 0.5; // 50% goes to authors
      readingEarnings = Math.round((totalTimeSpent / platformTotalTime) * authorPool);
    }
    
    // ✅ NEW: Add all earning categories
    const coinUnlockEarnings = author.earnings?.coinUnlocks || 0; // ₦10 per 24-hr unlock
    const tipEarnings = author.earnings?.tips || 0;               // ₦0.10 per coin tipped
    const triviaEarnings = author.earnings?.trivia || 0;          // ₦10 per trivia feature
    
    const totalEarnings = readingEarnings + coinUnlockEarnings + tipEarnings + triviaEarnings;

    // 7. Format books list for frontend
    const booksList = books.map(b => ({
      title: b.title,
      genre: b.genre || 'General',
      status: b.status || 'pending',
      createdAt: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-GB') : 'Recently'
    }));

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
        booksList: booksList, // ✅ NEW: Sends the actual list of books
        reads: totalReads,
        minutes: Math.floor(totalTime / 60),
        uniqueReaders
      },
      breakdown: {
        minutesShare: (minutesShare * 100).toFixed(2),
        readersShare: (readersShare * 100).toFixed(2),
        totalShare: (totalShare * 100).toFixed(2)
      },
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
