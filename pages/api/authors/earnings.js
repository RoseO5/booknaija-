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
      return     res.status(200).json({
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
