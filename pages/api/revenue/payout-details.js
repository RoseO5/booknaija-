import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

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

    // 3. Get current month's trivia featured authors (placeholder - will be updated when trivia is built)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const triviaFeaturedAuthors = await db.collection('trivia_config')
      .findOne({ month: currentMonth });

    // 4. Get current month's trivia winners (placeholder - will be updated when trivia is built)
    const triviaWinners = await db.collection('trivia_results')
      .find({ month: currentMonth })
      .sort({ score: -1, completionTime: 1 })
      .limit(3)
      .toArray();

    res.status(200).json({
      success: true,
      authorsTips: authorsWithTips.map(a => ({
        name: a.fullName,
        email: a.email,
        bank: a.bankName,
        accountNumber: a.accountNumber,
        accountName: a.accountName,
        tipAmount: a.earnings?.tips || 0
      })),
      authorsUnlocks: authorsWithUnlocks.map(a => ({
        name: a.fullName,
        email: a.email,
        bank: a.bankName,
        accountNumber: a.accountNumber,
        accountName: a.accountName,
        unlockAmount: a.earnings?.coinUnlocks || 0
      })),
      triviaFeatured: triviaFeaturedAuthors?.featuredAuthors || [],
      triviaWinners: triviaWinners.map((w, i) => ({
        rank: i + 1,
        name: w.userName,
        email: w.userEmail,
        phone: w.userPhone,
        bank: w.userBank,
        accountNumber: w.userAccountNumber,
        accountName: w.userAccountName,
        prize: i === 0 ? 250 : i === 1 ? 120 : 80
      })),
      month: currentMonth
    });
  } catch (error) {
    console.error('Payout details error:', error);
    res.status(500).json({ error: error.message });
  }
}
