import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const client = await clientPromise;
  const db = client.db('booknaija');

  const allBooks = await db.collection('books').find({}).toArray();

  res.status(200).json({
    totalBooks: allBooks.length,
    books: allBooks.map(b => ({
      title: b.title,
      authorName: b.authorName,
      authorEmail: b.authorEmail || 'NOT SET',
      status: b.status
    }))
  });
}
