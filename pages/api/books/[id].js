import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    // Find the book by its MongoDB ObjectId
    const book = await db.collection('books').findOne({ _id: new ObjectId(id) });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Convert _id to string so the frontend can compare it easily
    book._id = book._id.toString();

    res.status(200).json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
}
