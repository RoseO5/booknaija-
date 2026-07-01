import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');
    const authors = await db.collection('authors').find({}).sort({ createdAt: -1 }).toArray();
    res.status(200).json({ success: true, authors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
