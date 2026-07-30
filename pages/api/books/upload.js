import { v2 as cloudinary } from 'cloudinary';
import clientPromise from '../../../lib/mongodb';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  console.log('🚀 [UPLOAD API] Request received');

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const title = fields.title?.[0] || '';
    const authorName = fields.authorName?.[0] || 'Anonymous';
    const pdfFile = files.pdf?.[0]; 
    const coverFile = files.cover?.[0];

    console.log('✅ [UPLOAD API] Data received:', {
      title,
      authorName,
      hasPdf: !!pdfFile,
      hasCover: !!coverFile
    });

    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF file is missing.' });
    }

    // 🛡️ Abuse Detection
    const spamKeywords = ['casino', 'betting', 'loan', 'xxx', 'free money', 'crypto scam', 'hack'];
    const titleLower = title.toLowerCase();
    const hasSpam = spamKeywords.some(k => titleLower.includes(k));
    const abuseFlags = hasSpam ? ['spam-title'] : [];

    let pdfUrl = '';
    let coverUrl = 'https://via.placeholder.com/400x600/667eea/ffffff?text=' + encodeURIComponent(title || 'Book');

    // 1. ✅ Upload PDF as IMAGE (Cloudinary supports PDFs as images!)
    if (pdfFile) {
      console.log('📄 [UPLOAD API] Uploading PDF to Cloudinary as image...');
      try {
        const pdfBuffer = fs.readFileSync(pdfFile.filepath);
        const base64 = `data:${pdfFile.mimetype};base64,${pdfBuffer.toString('base64')}`;

        const pdfResult = await cloudinary.uploader.upload(base64, {
          resource_type: 'image', // ✅ PDFs work perfectly as images!
          folder: 'booknaija/pdfs',
          public_id: `pdf_${Date.now()}`,
          format: 'pdf', // Keep as PDF format
          timeout: 120000
        });
        
        pdfUrl = pdfResult.secure_url;
        console.log('✅ [UPLOAD API] PDF uploaded to Cloudinary:', pdfUrl);
      } catch (err) {
        console.error('❌ [UPLOAD API] PDF upload failed:', err.message);
        return res.status(500).json({ error: 'Failed to upload PDF to Cloudinary: ' + err.message });
      }
    }

    // 2. Upload Cover to Cloudinary
    if (coverFile) {
      console.log('🖼️ [UPLOAD API] Processing cover image...');
      try {
        const fileBuffer = fs.readFileSync(coverFile.filepath);
        const base64 = `data:${coverFile.mimetype};base64,${fileBuffer.toString('base64')}`;

        const coverResult = await cloudinary.uploader.upload(base64, {
          resource_type: 'image',
          folder: 'booknaija/covers',
          public_id: `cover_${Date.now()}`,
          overwrite: false,
          timeout: 60000
        });
        coverUrl = coverResult.secure_url;
        console.log('✅ [UPLOAD API] Cover uploaded to Cloudinary:', coverUrl);
      } catch (err) {
        console.error('❌ [UPLOAD API] Cover upload failed, using placeholder:', err.message);
      }
    }

    // 3. Save to MongoDB
    console.log('💾 [UPLOAD API] Saving to MongoDB...');
    const client = await clientPromise;
    const db = client.db('booknaija');

    const result = await db.collection('books').insertOne({
      title,
      authorName,
      pdfUrl,
      coverUrl,
      status: abuseFlags.length > 0 ? 'flagged' : 'pending',
      country: 'NG',
      abuseFlags,
      reports: 0,
      createdAt: new Date()
    });

    console.log('✅ [UPLOAD API] Success! Book saved with ID:', result.insertedId);

    res.status(200).json({
      success: true,
      message: abuseFlags.length > 0 ? '📝 Book uploaded & flagged for review' : '📝 Book uploaded! Pending admin approval.',
      bookId: result.insertedId
    });

  } catch (error) {
    console.error('💥 [UPLOAD API] Critical Error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
}
