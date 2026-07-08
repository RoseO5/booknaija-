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

  console.log('🚀 Upload API called');

  try {
    // Parse form data
    console.log('📝 Parsing form data...');
    const formData = await req.formData();
    
    const title = formData.get('title') || 'Untitled';
    const author = formData.get('authorName') || 'Anonymous';
    const pdfUrl = formData.get('pdfUrl');
    const coverFile = formData.get('cover');

    console.log('✅ Form data parsed:', { title, author, pdfUrl: pdfUrl ? 'exists' : 'missing' });

    if (!pdfUrl) {
      console.error('❌ No PDF URL provided');
      return res.status(400).json({ error: 'PDF URL required' });
    }

    // 🛡️ Abuse Detection
    const spamKeywords = ['casino', 'betting', 'loan', 'xxx', 'free money', 'crypto scam', 'hack'];
    const titleLower = title.toLowerCase();
    const hasSpam = spamKeywords.some(k => titleLower.includes(k));
    const abuseFlags = [];
    if (hasSpam) abuseFlags.push('spam-title');

    // Upload Cover to Cloudinary (if provided)
    let coverUrl = 'https://via.placeholder.com/400x600/667eea/ffffff?text=' + encodeURIComponent(title);
    
    if (coverFile && coverFile.name) {
      console.log('🖼️ Uploading cover to Cloudinary...', coverFile.name, 'Size:', coverFile.size);
      
      try {
        // Convert to base64 for more reliable upload
        const arrayBuffer = await coverFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = `data:${coverFile.type};base64,${buffer.toString('base64')}`;
        
        const coverResult = await cloudinary.uploader.upload(base64, {
          resource_type: 'image',
          folder: 'booknaija/covers',
          public_id: `cover_${Date.now()}_${title.replace(/\s+/g, '_')}`,
          overwrite: false,
          timeout: 60000 // 60 second timeout
        });
        
        coverUrl = coverResult.secure_url;
        console.log('✅ Cover uploaded:', coverUrl);
      } catch (coverError) {
        console.error('❌ Cover upload failed:', coverError);
        // Continue without cover - don't fail the whole upload
        coverUrl = 'https://via.placeholder.com/400x600/667eea/ffffff?text=' + encodeURIComponent(title);
      }
    }

    // Save to MongoDB
    console.log('💾 Saving to MongoDB...');
    const client = await clientPromise;
    const db = client.db('booknaija');
    const result = await db.collection('books').insertOne({
      title,
      authorName: author,
      pdfUrl,
      coverUrl,
      status: abuseFlags.length > 0 ? 'flagged' : 'pending',
      country: 'NG',
      abuseFlags,
      reports: 0,
      createdAt: new Date()
    });

    console.log('✅ Book saved to MongoDB:', result.insertedId);

    res.status(200).json({
      success: true,
      message: abuseFlags.length > 0 ? '📝 Book uploaded & flagged for review' : '📝 Book uploaded! Pending admin approval.',
      bookId: result.insertedId
    });
  } catch (error) {
    console.error('💥 Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
}
