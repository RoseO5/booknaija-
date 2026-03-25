import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    const books = await db.collection('books')
      .find({ status: 'published' })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, books, count: books.length });
  } catch (error) {
    console.error('List books error:', error);
    res.status(500).json({ error: 'Failed to fetch books', details: error.message });
  }
}
