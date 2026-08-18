import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    const pending = await db.collection('books').find({ status: 'pending' }).toArray();
    const flagged = await db.collection('books').find({ status: 'flagged' }).toArray();
    const published = await db.collection('books').find({ status: 'published' }).sort({ createdAt: -1 }).toArray();
    
    const users = await db.collection('users').countDocuments();
    const reads = await db.collection('reads').countDocuments();
    const authors = await db.collection('users').countDocuments({ role: 'author' });

    res.status(200).json({
      total: pending.length + flagged.length + published.length,
      pending,
      flagged,
      published, // ✅ NEW: Added published books list
      users,
      reads,
      authors
    });
  } catch (error) {
    console.error('Admin list error:', error);
    res.status(500).json({ error: error.message });
  }
}
