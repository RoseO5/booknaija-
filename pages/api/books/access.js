import { v2 as cloudinary } from 'cloudinary';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { bookId, userEmail } = req.query;

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    const user = await db.collection('users').findOne({ email: userEmail });
    if (!user) return res.status(403).json({ error: 'User not found.' });
    if (!user.subscription?.active) return res.status(403).json({ error: 'Active subscription required.' });

    const book = await db.collection('books').findOne({ _id: new ObjectId(bookId) });
    if (!book) return res.status(404).json({ error: 'Book not found.' });

    let finalUrl = '';

    // ✅ CHECK IF BOOK HAS pdfPublicId (NEW UPLOADS)
    if (book.pdfPublicId) {
      // Generate signed URL with inline flag (forces browser to display, not download)
      finalUrl = cloudinary.url(book.pdfPublicId, {
        resource_type: 'raw',
        type: 'upload',
        sign_url: true,
        flags: 'inline',
        expires_at: Math.floor(Date.now() / 1000) + 3600 // Valid for 1 hour
      });
      console.log('✅ Generated signed inline URL for:', book.title);
    } 
    // ✅ OLD BOOKS (NO pdfPublicId)
    else if (book.pdfUrl) {
      // Return the direct URL (will download, but at least it works)
      finalUrl = book.pdfUrl;
      console.log('✅ Using direct URL for old book:', book.title);
    } 
    else {
      return res.status(404).json({ error: 'PDF not found for this book.' });
    }

    res.status(200).json({ url: finalUrl });

  } catch (error) {
    console.error('❌ BOOK ACCESS ERROR:', error);
    res.status(500).json({ error: 'Server Error: ' + error.message });
  }
}
