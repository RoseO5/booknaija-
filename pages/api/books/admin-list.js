import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    const [pending, flagged, total] = await Promise.all([
      db.collection('books').find({ status: 'pending' }).sort({ createdAt: -1 }).toArray(),
      db.collection('books').find({ status: 'flagged' }).sort({ createdAt: -1 }).toArray(),
      db.collection('books').countDocuments()
    ]);

    res.status(200).json({ pending, flagged, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
