import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    // 1. Total coin purchases (₦100 each)
    const coinPurchases = await db.collection('users').aggregate([
      { $unwind: '$coinTransactions' },
      { $match: { 'coinTransactions.type': 'earn', 'coinTransactions.reason': 'Purchased coins via Paystack' } },
      { $group: { _id: null, totalPurchases: { $sum: 1 }, totalCoinsBought: { $sum: '$coinTransactions.amount' } } }
    ]).toArray();

    const totalPurchases = coinPurchases[0]?.totalPurchases || 0;
    const totalCoinsBought = coinPurchases[0]?.totalCoinsBought || 0;
    const totalPurchaseRevenue = totalPurchases * 100; // ₦100 per purchase

    // 2. Total tips paid to authors
    const tipsPaid = await db.collection('authors').aggregate([
      { $group: { _id: null, totalTips: { $sum: { $ifNull: ['$earnings.tips', 0] } } } }
    ]).toArray();

    const totalTipsPaid = tipsPaid[0]?.totalTips || 0;

    // 3. Calculate net profit from coin purchases
    const netProfitFromCoins = totalPurchaseRevenue - totalTipsPaid;

    // 4. Book unlock revenue (₦50 each, author gets ₦10, you get ₦40)
    const unlockRevenue = await db.collection('authors').aggregate([
      { $group: { _id: null, totalUnlocks: { $sum: { $ifNull: ['$earnings.coinUnlocks', 0] } } } }
    ]).toArray();

    const totalUnlockAuthorPayout = unlockRevenue[0]?.totalUnlocks || 0;
    const totalUnlockRevenue = totalUnlockAuthorPayout * 5; // ₦50 per unlock (author gets ₦10, but we track ₦5 per ₦25 portion)
    const totalUnlockYourProfit = totalUnlockRevenue - totalUnlockAuthorPayout;

    // 5. Trivia pool tracking (placeholder - we'll update this when trivia is built)
    const triviaPool = 0; // Will be calculated from trivia entries

    res.status(200).json({
      success: true,
      coinPurchases: {
        count: totalPurchases,
        totalCoins: totalCoinsBought,
        revenue: totalPurchaseRevenue
      },
      tips: {
        totalPaid: totalTipsPaid
      },
      unlocks: {
        authorPayout: totalUnlockAuthorPayout,
        totalRevenue: totalUnlockRevenue,
        yourProfit: totalUnlockYourProfit
      },
      trivia: {
        pool: triviaPool
      },
      summary: {
        totalRevenue: totalPurchaseRevenue + totalUnlockRevenue,
        totalAuthorPayouts: totalTipsPaid + totalUnlockAuthorPayout,
        yourNetProfit: netProfitFromCoins + totalUnlockYourProfit
      }
    });
  } catch (error) {
    console.error('Coin analytics error:', error);
    res.status(500).json({ error: error.message });
  }
}
