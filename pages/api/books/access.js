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
    if (!book || !book.pdfPublicId) return res.status(404).json({ error: 'Book or PDF not found.' });

    // ✅ THE MAGIC: 'image' resource + 'pdf' format + 'inline' flag forces browser to render, not download
    const secureUrl = cloudinary.url(book.pdfPublicId, {
      resource_type: 'image',
      format: 'pdf',
      flags: 'inline', // Forces the browser to display the PDF in the tab/iframe
      sign_url: true,  // Prevents unauthorized sharing
      expires_at: Math.floor(Date.now() / 1000) + 3600 // Link expires in 1 hour
    });

    console.log('✅ Generated secure inline URL for:', book.title);
    res.status(200).json({ url: secureUrl });

  } catch (error) {
    console.error('❌ BOOK ACCESS ERROR:', error);
    res.status(500).json({ error: 'Server Error: ' + error.message });
  }
}
