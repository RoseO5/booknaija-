import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const client = await clientPromise;
    const db = client.db('booknaija');

    // 1. Get author (Case-insensitive match)
    let author = await db.collection('authors').findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!author) return res.status(404).json({ error: `Author profile not found for email: "${email}"` });

    // 2. Get all books by this author (flexible name matching)
    const cleanName = author.fullName.trim().replace(/\s+/g, ' ');
    const nameWords = cleanName.split(' ');
    const flexibleNameRegex = new RegExp(nameWords.join('.*'), 'i');

    const books = await db.collection('books').find({
      $or: [
        { authorEmail: author.email },
        { authorName: flexibleNameRegex }
      ]
    }).toArray();

    // Get the IDs of the author's books
    const bookIds = books.map(b => b._id.toString());

    // 3. Calculate reading earnings (100% time-based, completed reads ON AUTHOR'S BOOKS)
    const authorReadsAgg = await db.collection('reads').aggregate([
      { $match: { bookId: { $in: bookIds }, completed: true } },
      { $group: { _id: null, totalTime: { $sum: '$timeSpent' } } }
    ]).toArray();
    
    const totalTimeSpent = authorReadsAgg.length > 0 ? authorReadsAgg[0].totalTime : 0;

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

    // 4. Get other earnings from author document
    const coinUnlockEarnings = author.earnings?.coinUnlocks || 0;
    const tipEarnings = author.earnings?.tips || 0;
    const triviaEarnings = author.earnings?.trivia || 0;

    const totalEarnings = readingEarnings + coinUnlockEarnings + tipEarnings + triviaEarnings;

    // 5. Send response
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
        totalTimeSpent: totalTimeSpent
      },
      breakdown: {
        readingPercent: platformTotalTime > 0 ? ((totalTimeSpent / platformTotalTime) * 100).toFixed(2) : '0.00'
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
