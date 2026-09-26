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

    // 2. Check Payout Status for Current Month
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g., "2026-09"
    const payoutStatus = author.payouts && author.payouts[currentMonth] === 'paid' ? 'paid' : 'pending';
    const lastPaidMonth = author.lastPaidMonth || null;

    // 3. Find Books (Flexible name matching)
    const cleanName = author.fullName.trim().replace(/\s+/g, ' ');
    const nameWords = cleanName.split(' ');
    const flexibleNameRegex = new RegExp(nameWords.join('.*'), 'i');

    const books = await db.collection('books').find({
      $or: [
        { authorEmail: author.email },
        { authorName: flexibleNameRegex }
      ]
    }).sort({ createdAt: -1 }).toArray();

    const bookIds = books.map(b => b._id);

    // 4. Calculate Earnings (ONLY if NOT yet paid for this month)
    let totalTimeSpent = 0;
    let totalReads = 0;
    let readingEarnings = 0;
    let coinUnlockEarnings = 0;
    let tipEarnings = 0;
    let triviaEarnings = 0;

    if (payoutStatus === 'pending') {
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

      if (totalTimeSpent > 0 && platformTotalTime > 0) {
        const activeSubscribers = await db.collection('users').countDocuments({ 'subscription.active': true });
        const monthlyRevenue = activeSubscribers * 1000;
        const authorPool = monthlyRevenue * 0.5;
        readingEarnings = Math.round((totalTimeSpent / platformTotalTime) * authorPool);
      }

      coinUnlockEarnings = author.earnings?.coinUnlocks || 0;
      tipEarnings = author.earnings?.tips || 0;
      triviaEarnings = author.earnings?.trivia || 0;
    }

    const totalEarnings = readingEarnings + coinUnlockEarnings + tipEarnings + triviaEarnings;

    const booksList = books.map(b => ({
      title: b.title,
      genre: b.genre || 'General',
      status: b.status || 'pending',
      createdAt: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-GB') : 'Recently'
    }));

    res.status(200).json({
      isAuthor: true,
      payoutStatus,
      lastPaidMonth,
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
