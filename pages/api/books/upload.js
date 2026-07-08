import { v2 as cloudinary } from 'cloudinary';
import clientPromise from '../../../lib/mongodb';

// Configure Cloudinary (covers only)
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
    const pdfUrl = formData.get('pdfUrl'); // The direct link from R2 (Selar Method)
    const coverFile = formData.get('cover');

    if (!pdfUrl) return res.status(400).json({ error: 'PDF URL required' });

    // 🛡️ Abuse Detection
    const spamKeywords = ['casino', 'betting', 'loan', 'xxx', 'free money', 'crypto scam', 'hack'];
    const titleLower = title.toLowerCase();
    const hasSpam = spamKeywords.some(k => titleLower.includes(k));
    const abuseFlags = [];
    if (hasSpam) abuseFlags.push('spam-title');

    // Upload Cover to Cloudinary (if provided)
    let coverUrl = 'https://via.placeholder.com/400x600/667eea/ffffff?text=' + encodeURIComponent(title);
    if (coverFile && coverFile.name) {
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
      const coverResult = await cloudinary.uploader.upload(coverBuffer, {
        resource_type: 'image',
        folder: 'booknaija/covers',
        public_id: `cover_${Date.now()}_${title}`,
        overwrite: false
      });
      coverUrl = coverResult.secure_url;
    }

    // Save to MongoDB
    const client = await clientPromise;
    const db = client.db('booknaija');
    const result = await db.collection('books').insertOne({
      title,
      authorName: author,
      pdfUrl, // Save the direct R2 link
      coverUrl,
      status: abuseFlags.length > 0 ? 'flagged' : 'pending',
      country: 'NG', // Default Nigeria
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
