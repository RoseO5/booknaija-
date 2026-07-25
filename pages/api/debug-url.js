import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    // Get the most recent book
    const book = await db.collection('books').findOne({}, { sort: { createdAt: -1 } });
    
    if (!book) {
      return res.status(404).json({ error: 'No books found' });
    }
    
    res.status(200).json({
      title: book.title,
      storedPdfUrl: book.pdfUrl,
      bookId: book._id.toString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
