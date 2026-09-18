import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  // Only allow GET requests, and ideally only from localhost or with a secret (for safety)
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    // 1. Add coin fields to all existing users (adds new fields, doesn't overwrite existing data)
    const result = await db.collection('users').updateMany(
      {},
      {
        $set: {
          coins: 0,
          premiumUnlocks: [],
          lastDailyBonus: null,
          coinTransactions: []
        }
      }
    );
    
    res.status(200).json({
      success: true,
      message: `✅ Migration complete! Added coin fields to ${result.modifiedCount} users.`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ error: error.message });
  }
}
