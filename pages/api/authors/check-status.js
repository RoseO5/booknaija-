import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const client = await clientPromise;
    const db = client.db('booknaija');
    const author = await db.collection('authors').findOne({ email });

    res.status(200).json({ 
      isOnboarded: !!author,
      author: author ? { name: author.fullName, status: author.status } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
