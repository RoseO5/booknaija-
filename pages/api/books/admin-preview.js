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

  const { bookId, adminEmail } = req.query;

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    // Verify admin access (owner email or admin role)
    const user = await db.collection('users').findOne({ email: adminEmail });
    const isOwner = adminEmail === 'talktorose90@gmail.com';
    const isAdmin = user?.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    const book = await db.collection('books').findOne({ _id: new ObjectId(bookId) });
    if (!book) return res.status(404).json({ error: 'Book not found.' });

    let finalUrl = '';

    // Generate secure inline URL for new books
    if (book.pdfPublicId) {
      finalUrl = cloudinary.url(book.pdfPublicId, {
        resource_type: 'image',
        format: 'pdf',
        flags: 'inline',
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600
      });
    } 
    // Fallback for old books
    else if (book.pdfUrl) {
      finalUrl = book.pdfUrl;
    } 
    else {
      return res.status(404).json({ error: 'PDF not found for this book.' });
    }

    res.status(200).json({ url: finalUrl, title: book.title });

  } catch (error) {
    console.error('❌ ADMIN PREVIEW ERROR:', error);
    res.status(500).json({ error: 'Server Error: ' + error.message });
  }
}
