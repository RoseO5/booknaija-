import { v2 as cloudinary } from 'cloudinary';
import clientPromise from '../../../lib/mongodb';

// 🚀 CRITICAL: Disable Next.js body parser to avoid conflicts with native formData
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
    // Parse form data natively
    console.log('📝 [UPLOAD API] Parsing form data...');
    const formData = await req.formData();
    
    const title = formData.get('title');
    const author = formData.get('authorName');
    const pdfUrl = formData.get('pdfUrl');
    const coverFile = formData.get('cover');

    console.log('✅ [UPLOAD API] Data received:', { 
      title, 
      author,
      pdfUrl: pdfUrl ? 'Present' : 'Missing',
      hasCover: coverFile && coverFile.name ? true : false
    });

    if (!pdfUrl) {
      console.error('❌ [UPLOAD API] Missing PDF URL');
      return res.status(400).json({ error: 'PDF URL is missing. The direct upload may have failed.' });
    }

    // 🛡️ Abuse Detection
    const spamKeywords = ['casino', 'betting', 'loan', 'xxx', 'free money', 'crypto scam', 'hack'];
    const titleLower = (title || '').toLowerCase();
    const hasSpam = spamKeywords.some(k => titleLower.includes(k));
    const abuseFlags = hasSpam ? ['spam-title'] : [];

    // Upload Cover to Cloudinary
    let coverUrl = 'https://via.placeholder.com/400x600/667eea/ffffff?text=' + encodeURIComponent(title || 'Book');
    
    if (coverFile && coverFile.name) {
      console.log('🖼️ [UPLOAD API] Processing cover image...', coverFile.name, 'Size:', coverFile.size);
      try {
        const arrayBuffer = await coverFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = `data:${coverFile.type};base64,${buffer.toString('base64')}`;
        
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
      authorName: author || 'Anonymous',
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
