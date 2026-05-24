import { v2 as cloudinary } from 'cloudinary';
import clientPromise from '../../../lib/mongodb';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const formData = await req.formData();
    const title = formData.get('title') || 'Untitled';
    const author = formData.get('authorName') || 'Anonymous';
    const pdfFile = formData.get('pdf');

    if (!pdfFile) return res.status(400).json({ error: 'PDF required' });

    // 🛡️ Abuse Detection
    const spamKeywords = ['casino', 'betting', 'loan', 'xxx', 'free money', 'crypto scam', 'hack'];
    const titleLower = title.toLowerCase();
    const hasSpam = spamKeywords.some(k => titleLower.includes(k));
    const isLarge = pdfFile.size > 5 * 1024 * 1024; // 5MB
    const abuseFlags = [];
    if (hasSpam) abuseFlags.push('spam-title');
    if (isLarge) abuseFlags.push('oversized-file');

    // Upload to Cloudinary
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const cloudResult = await cloudinary.uploader.upload(buffer, {
      resource_type: 'raw',
      folder: 'booknaija/books',
      public_id: `book_${Date.now()}_${title}`,
      overwrite: false
    });

    // Save to MongoDB with PENDING status
    const client = await clientPromise;
    const db = client.db('booknaija');
    const result = await db.collection('books').insertOne({
      title,
      authorName: author,
      pdfUrl: cloudResult.secure_url,
      status: abuseFlags.length > 0 ? 'flagged' : 'pending',
      abuseFlags,
      reports: 0,
      createdAt: new Date()
    });

    res.status(200).json({ 
      success: true, 
      message: abuseFlags.length > 0 ? '📝 Book uploaded & flagged for review' : '📝 Book uploaded! Pending admin approval.',
      bookId: result.insertedId
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
}
