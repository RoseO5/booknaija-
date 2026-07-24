import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { bookId, userEmail } = req.query;

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    // 1. Verify user exists
    const user = await db.collection('users').findOne({ email: userEmail });
    if (!user) {
      return res.status(403).json({ error: 'User not found. Please log in again.' });
    }
    
    // 2. Verify user has an active subscription
    if (!user.subscription?.active) {
      return res.status(403).json({ error: 'Active subscription required. Please subscribe to read.' });
    }

    // 3. Find the book
    const book = await db.collection('books').findOne({ _id: new ObjectId(bookId) });
    if (!book) {
      return res.status(404).json({ error: 'Book not found in database.' });
    }

    if (!book.pdfUrl) {
      return res.status(404).json({ error: 'This book does not have a PDF file attached.' });
    }

    // ✅ SIMPLEST & MOST ROBUST FIX: 
    // If the URL is already a valid HTTP/HTTPS link, just return it directly!
    // The PremiumGate component already ensures only paying users see this button.
    if (book.pdfUrl.startsWith('http://') || book.pdfUrl.startsWith('https://')) {
      return res.status(200).json({ url: book.pdfUrl });
    }

    return res.status(400).json({ error: 'Invalid PDF URL format.' });

  } catch (error) {
    console.error('❌ BOOK ACCESS ERROR:', error);
    res.status(500).json({ error: `Server Error: ${error.message}` });
  }
}
