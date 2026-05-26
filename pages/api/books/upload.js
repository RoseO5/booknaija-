import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v2 as cloudinary } from 'cloudinary';
import clientPromise from '../../../lib/mongodb';

// Configure Cloudinary (covers only)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure R2 (PDFs)
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const formData = await req.formData();
    const title = formData.get('title') || 'Untitled';
    const author = formData.get('authorName') || 'Anonymous';
    const pdfFile = formData.get('pdf');
    const coverFile = formData.get('cover');

    if (!pdfFile) return res.status(400).json({ error: 'PDF required' });

    // 🛡️ Abuse Detection
    const spamKeywords = ['casino', 'betting', 'loan', 'xxx', 'free money', 'crypto scam', 'hack'];
    const titleLower = title.toLowerCase();
    const hasSpam = spamKeywords.some(k => titleLower.includes(k));
    const isLarge = pdfFile.size > 5 * 1024 * 1024;
    const abuseFlags = [];
    if (hasSpam) abuseFlags.push('spam-title');
    if (isLarge) abuseFlags.push('oversized-file');

    // Upload PDF to R2
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    const pdfKey = `books/${Date.now()}_${encodeURIComponent(title)}.pdf`;
    await r2.send(new PutObjectCommand({
      Bucket: 'booknaija-pdfs',
      Key: pdfKey,
      Body: pdfBuffer,
      ContentType: 'application/pdf'
    }));

    const pdfUrl = `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${pdfKey}`;

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
      pdfUrl,
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
