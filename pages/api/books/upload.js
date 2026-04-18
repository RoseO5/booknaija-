import { v2 as cloudinary } from 'cloudinary';
import clientPromise from '../../../lib/mongodb';

// Use your existing Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    // Get form data (Next.js 13+ handles this automatically)
    const formData = await req.formData();
    const title = formData.get('title') || 'Untitled';
    const author = formData.get('authorName') || 'Anonymous';
    const pdfFile = formData.get('pdf');

    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF required' });
    }

    // Upload to Cloudinary (reuse your SellAny pattern)
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const cloudResult = await cloudinary.uploader.upload(
      buffer,
      {
        resource_type: 'raw',
        folder: 'booknaija/books',
        public_id: `book_${Date.now()}_${title}`,
        overwrite: false
      }
    );

    // Save to MongoDB
    const client = await clientPromise;
    const db = client.db('booknaija');
    await db.collection('books').insertOne({
      title,
      authorName: author,
      pdfUrl: cloudResult.secure_url,
      status: 'published',
      createdAt: new Date()
    });

    res.status(200).json({ 
      success: true, 
      message: '✅ Uploaded!',
      book: { title, pdfUrl: cloudResult.secure_url }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
}
