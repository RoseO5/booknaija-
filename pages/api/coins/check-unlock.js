import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const { userId, bookId } = req.query;
    if (!userId || !bookId) return res.status(400).json({ error: 'userId and bookId required' });

    const client = await clientPromise;
    const db = client.db('booknaija');

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = new Date();
    
    // Check if bookId is in premiumUnlocks and expiresAt is in the future
    const isValidUnlock = user.premiumUnlocks?.some(
      (unlock) => unlock.bookId === bookId && new Date(unlock.expiresAt) > now
    );

    res.status(200).json({
      isValid: isValidUnlock,
      balance: user.coins || 0
    });
  } catch (error) {
    console.error('Check unlock error:', error);
    res.status(500).json({ error: error.message });
  }
}
