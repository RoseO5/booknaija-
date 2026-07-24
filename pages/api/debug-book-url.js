import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    // Get the most recent book to check its URL format
    const book = await db.collection('books').findOne({}, { sort: { createdAt: -1 } });
    
    if (!book) {
      return res.status(404).json({ error: 'No books found' });
    }
    
    res.status(200).json({
      title: book.title,
      pdfUrl: book.pdfUrl,
      urlParts: book.pdfUrl ? book.pdfUrl.split('/') : null,
      status: book.status,
      _id: book._id.toString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
