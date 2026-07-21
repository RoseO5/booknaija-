import { v2 as cloudinary } from 'cloudinary';
import clientPromise from '../../../lib/mongodb';
import formidable from 'formidable';
import fs from 'fs';

// 🚀 CRITICAL: Disable Next.js body parser so formidable can read the raw stream
export const config = {
  api: {
    bodyParser: false,
  },
};

// Configure Cloudinary (covers only)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  console.log('🚀 [UPLOAD API] Request received');

  try {
    // ✅ Use formidable to correctly parse multipart/form-data
    console.log('📝 [UPLOAD API] Parsing form data with formidable...');
    const form = formidable({});
    
    // form.parse returns an array: [fields, files]
    const [fields, files] = await form.parse(req);

    // formidable wraps values in arrays, so we grab the first item [0]
    const title = fields.title?.[0] || '';
    const authorName = fields.authorName?.[0] || 'Anonymous';
    const pdfUrl = fields.pdfUrl?.[0];
    const coverFile = files.cover?.[0]; // This is the actual file object

    console.log('✅ [UPLOAD API] Data received:', {
      title,
      authorName,
      pdfUrl: pdfUrl ? 'Present' : 'Missing',
      hasCover: !!coverFile
    });

    if (!pdfUrl) {
      console.error('❌ [UPLOAD API] Missing PDF URL');
      return res.status(400).json({ error: 'PDF URL is missing.' });
    }

    // 🛡️ Abuse Detection
    const spamKeywords = ['casino', 'betting', 'loan', 'xxx', 'free money', 'crypto scam', 'hack'];
    const titleLower = title.toLowerCase();
    const hasSpam = spamKeywords.some(k => titleLower.includes(k));
    const abuseFlags = hasSpam ? ['spam-title'] : [];

    // Upload Cover to Cloudinary
    let coverUrl = 'https://via.placeholder.com/400x600/667eea/ffffff?text=' + encodeURIComponent(title || 'Book');

    if (coverFile) {
      console.log('🖼️ [UPLOAD API] Processing cover image...');
      try {
        // Read the temporary file created by formidable
        const fileBuffer = fs.readFileSync(coverFile.filepath);
        const base64 = `data:${coverFile.mimetype};base64,${fileBuffer.toString('base64')}`;

        const coverResult = await cloudinary.uploader.upload(base64, {
          resource_type: 'image',
          folder: 'booknaija/covers',
          public_id: `cover_${Date.now()}`,
          overwrite: false,
          timeout: 60000 // 60 second timeout
        });
        coverUrl = coverResult.secure_url;
        console.log('✅ [UPLOAD API] Cover uploaded to Cloudinary:', coverUrl);
      } catch (err) {
        console.error('❌ [UPLOAD API] Cover upload failed, using placeholder:', err.message);
        // Continue without cover - don't fail the whole upload
      }
    }

    // Save to MongoDB
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
