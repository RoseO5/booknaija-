import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { bookId, userEmail } = req.query;

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    // 1. Verify user exists and has an active subscription
    const user = await db.collection('users').findOne({ email: userEmail });
    if (!user) return res.status(403).json({ error: 'User not found.' });
    if (!user.subscription?.active) return res.status(403).json({ error: 'Active subscription required.' });

    // 2. Find the book
    const book = await db.collection('books').findOne({ _id: new ObjectId(bookId) });
    if (!book || !book.pdfUrl) return res.status(404).json({ error: 'Book or PDF not found.' });

    // 3. ✅ CONSTRUCT THE NEW PUBLIC URL
    // Take the existing URL, and replace the hostname with your new public R2 domain
    const urlObj = new URL(book.pdfUrl);
    urlObj.hostname = 'pub-f5ccd8dd913c454a96f0ac2a3318cc46.r2.dev';
    
    const publicUrl = urlObj.toString();
    console.log('✅ Generated public URL:', publicUrl);

    // 4. Return the public URL to the frontend
    res.status(200).json({ url: publicUrl });

  } catch (error) {
    console.error('❌ BOOK ACCESS ERROR:', error);
    res.status(500).json({ error: `Server Error: ${error.message}` });
  }
}
