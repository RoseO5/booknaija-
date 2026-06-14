import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  
  const { userId, email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  // Simple verification: user must provide email matching account
  const client = await clientPromise;
  const db = client.db('booknaija');
  
  const result = await db.collection('users').deleteOne({ email });
  
  if (result.deletedCount > 0) {
    res.status(200).json({ success: true, message: '✅ Account deleted. Thank you for using BookNaija.' });
  } else {
    res.status(404).json({ error: 'Account not found' });
  }
}
