import { v2 as cloudinary } from 'cloudinary';
import clientPromise from '../../../lib/mongodb';
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const title = fields.title?.[0] || '';
    const authorName = fields.authorName?.[0] || 'Anonymous';
    const pdfFile = files.pdf?.[0]; 
    const coverFile = files.cover?.[0];

    if (!pdfFile) return res.status(400).json({ error: 'PDF file is missing.' });

    const spamKeywords = ['casino', 'betting', 'loan', 'xxx', 'free money', 'crypto scam', 'hack'];
    const hasSpam = spamKeywords.some(k => title.toLowerCase().includes(k));
    const abuseFlags = hasSpam ? ['spam-title'] : [];

    let pdfUrl = '';
    let coverUrl = 'https://via.placeholder.com/400x600/667eea/ffffff?text=' + encodeURIComponent(title || 'Book');

    // Upload PDF as RAW (most reliable for direct file serving)
    if (pdfFile) {
      const pdfBuffer = fs.readFileSync(pdfFile.filepath);
      const base64 = `data:${pdfFile.mimetype};base64,${pdfBuffer.toString('base64')}`;

      const pdfResult = await cloudinary.uploader.upload(base64, {
        resource_type: 'raw',
        folder: 'booknaija/pdfs',
        public_id: `pdf_${Date.now()}`,
        timeout: 120000
      });
      pdfUrl = pdfResult.secure_url;
    }

    // Upload Cover
    if (coverFile) {
      const fileBuffer = fs.readFileSync(coverFile.filepath);
      const base64 = `data:${coverFile.mimetype};base64,${fileBuffer.toString('base64')}`;
      const coverResult = await cloudinary.uploader.upload(base64, {
        resource_type: 'image',
        folder: 'booknaija/covers',
        public_id: `cover_${Date.now()}`,
        timeout: 60000
      });
      coverUrl = coverResult.secure_url;
    }

    const client = await clientPromise;
    const db = client.db('booknaija');
    const result = await db.collection('books').insertOne({
      title, authorName, pdfUrl, coverUrl,
      status: abuseFlags.length > 0 ? 'flagged' : 'pending',
      country: 'NG', abuseFlags, reports: 0, createdAt: new Date()
    });

    res.status(200).json({ success: true, message: 'Book uploaded!', bookId: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
}
