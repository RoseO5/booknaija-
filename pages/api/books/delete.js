import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookId } = req.body || req.query;
    if (!bookId) return res.status(400).json({ error: 'bookId required' });

    const client = await clientPromise;
    const db = client.db('booknaija');

    // Permanently delete the book from the database
    const result = await db.collection('books').deleteOne({ _id: new ObjectId(bookId) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(200).json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ error: error.message });
  }
}
