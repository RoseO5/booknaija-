import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 1. Get all authors who received tips (with amounts)
    const authorsWithTips = await db.collection('authors').find({
      'earnings.tips': { $gt: 0 }
    }).project({
      fullName: 1,
      email: 1,
      bankName: 1,
      accountNumber: 1,
      accountName: 1,
      'earnings.tips': 1
    }).toArray();

    // 2. Get all authors who received coin unlock earnings (₦10 each)
    const authorsWithUnlocks = await db.collection('authors').find({
      'earnings.coinUnlocks': { $gt: 0 }
    }).project({
      fullName: 1,
      email: 1,
      bankName: 1,
      accountNumber: 1,
      accountName: 1,
      'earnings.coinUnlocks': 1
    }).toArray();

    // 3. TRIVIA: Get current month's tournament and config
    const tournament = await db.collection('trivia_entries').findOne({ month: currentMonth });
    const config = await db.collection('trivia_config').findOne({ month: currentMonth });

    // Calculate trivia payouts (10% of pool split among featured authors)
    const totalPool = tournament?.totalPoolNaira || 0;
    const authorPool = Math.floor(totalPool * 0.10); // 10% for authors
    const featuredBooks = config?.featuredBooks || [];
    const perAuthor = featuredBooks.length > 0 ? Math.floor(authorPool / featuredBooks.length) : 0;

    // Get featured authors with their bank details
    let triviaFeaturedAuthors = [];
    for (const book of featuredBooks) {
      const author = await db.collection('authors').findOne({ email: book.authorEmail });
      if (author) {
        triviaFeaturedAuthors.push({
          name: author.fullName,
          email: author.email,
          bank: author.bankName,
          accountNumber: author.accountNumber,
          accountName: author.accountName,
          bookTitle: book.title,
          prize: perAuthor
        });
      }
    }

    // 4. TRIVIA WINNERS (Top 3)
    const players = tournament?.players || [];
    const finishedPlayers = players
      .filter(p => p.finished)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.completionTime - b.completionTime;
      });

    const winners = [];
    const prizeAmounts = [
      Math.floor(totalPool * 0.30), // 1st: 30%
      Math.floor(totalPool * 0.14), // 2nd: 14%
      Math.floor(totalPool * 0.06)  // 3rd: 6%
    ];

    for (let i = 0; i < Math.min(3, finishedPlayers.length); i++) {
      const w = finishedPlayers[i];
      // Fetch user details for bank info
      let userPhone = 'Not provided', userBank = 'Not provided', userAccount = 'Not provided', userAccountName = 'Not provided';
      if (w.userId) {
        try {
          const user = await db.collection('users').findOne({ _id: new ObjectId(w.userId) });
          if (user) {
            userPhone = user.phone || 'Not provided';
            userBank = user.bankName || 'Not provided';
            userAccount = user.accountNumber || 'Not provided';
            userAccountName = user.accountName || 'Not provided';
          }
        } catch (e) {
          console.error("Error fetching user for trivia winner:", e);
        }
      }
      
      winners.push({
        rank: i + 1,
        name: w.userName || 'Anonymous',
        email: w.userEmail,
        phone: userPhone,
        bank: userBank,
        accountNumber: userAccount,
        accountName: userAccountName,
        score: w.score,
        completionTime: w.completionTime,
        prize: prizeAmounts[i]
      });
    }

    // 5. Calculate totals
    const totalTipsPayout = authorsWithTips.reduce((sum, a) => sum + (a.earnings?.tips || 0), 0);
    const totalUnlocksPayout = authorsWithUnlocks.reduce((sum, a) => sum + (a.earnings?.coinUnlocks || 0), 0);
    const totalTriviaAuthorsPayout = triviaFeaturedAuthors.reduce((sum, a) => sum + a.prize, 0);
    const totalWinnersPayout = winners.reduce((sum, w) => sum + w.prize, 0);
    const grandTotalPayout = totalTipsPayout + totalUnlocksPayout + totalTriviaAuthorsPayout + totalWinnersPayout;

    res.status(200).json({
      success: true,
      month: currentMonth,
      
      authorsTips: authorsWithTips.map(a => ({
        name: a.fullName,
        email: a.email,
        bank: a.bankName,
        accountNumber: a.accountNumber,
        accountName: a.accountName,
        amount: a.earnings?.tips || 0,
        category: 'tips'
      })),

      authorsUnlocks: authorsWithUnlocks.map(a => ({
        name: a.fullName,
        email: a.email,
        bank: a.bankName,
        accountNumber: a.accountNumber,
        accountName: a.accountName,
        amount: a.earnings?.coinUnlocks || 0,
        category: 'unlocks'
      })),

      triviaFeatured: triviaFeaturedAuthors,
      triviaWinners: winners,

      summary: {
        totalTipsPayout,
        totalUnlocksPayout,
        totalTriviaAuthorsPayout,
        totalWinnersPayout,
        grandTotalPayout,
        yourProfit: Math.floor(totalPool * 0.40) // Your 40% from trivia
      }
    });
  } catch (error) {
    console.error('Payout details error:', error);
    res.status(500).json({ error: error.message });
  }
}
