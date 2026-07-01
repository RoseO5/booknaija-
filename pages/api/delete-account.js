import clientPromise from '../../lib/mongodb';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const client = await clientPromise;
  const db = client.db('booknaija');
  const result = await db.collection('users').deleteOne({ email });
  if (result.deletedCount > 0) {
    res.status(200).json({ success: true, message: 'Account deleted' });
  } else {
    res.status(404).json({ error: 'Account not found' });
  }
}
