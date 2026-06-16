import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // 🔐 Simple admin auth: check secret header
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const client = await clientPromise;
  const db = client.db('booknaija');
  
  const result = await db.collection('users').updateOne(
    { email },
    { 
      $set: {
        'subscription.active': true,
        'subscription.plan': 'reader-premium',
        'subscription.provider': 'selar-manual',
        'subscription.expiresAt': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        'subscription.activatedAt': new Date()
      }
    }
  );

  res.status(200).json({ 
    success: result.modifiedCount > 0,
    message: result.modifiedCount > 0 ? '✅ Premium activated' : 'User not found'
  });
}
