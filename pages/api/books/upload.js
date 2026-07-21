import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  console.log('🚀 [UPLOAD API] Request received');

  try {
    // ✅ The frontend sends JSON, so we read directly from req.body
    const { title, authorName, pdfUrl, coverUrl } = req.body;

    console.log('📝 [UPLOAD API] Data received:', { 
      title, 
      authorName,
      pdfUrl: pdfUrl ? 'Present' : 'Missing',
      coverUrl: coverUrl ? 'Present' : 'Missing'
    });

    if (!pdfUrl) {
      console.error('❌ [UPLOAD API] Missing PDF URL');
      return res.status(400).json({ error: 'PDF URL is missing.' });
    }

    // 🛡️ Abuse Detection
    const spamKeywords = ['casino', 'betting', 'loan', 'xxx', 'free money', 'crypto scam', 'hack'];
    const titleLower = (title || '').toLowerCase();
    const hasSpam = spamKeywords.some(k => titleLower.includes(k));
    const abuseFlags = hasSpam ? ['spam-title'] : [];

    // Use the coverUrl sent from frontend, or a placeholder if missing
    const finalCoverUrl = coverUrl || `https://via.placeholder.com/400x600/667eea/ffffff?text=${encodeURIComponent(title || 'Book')}`;

    // Save to MongoDB
    console.log('💾 [UPLOAD API] Saving to MongoDB...');
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    const result = await db.collection('books').insertOne({
      title,
      authorName: authorName || 'Anonymous',
      pdfUrl,
      coverUrl: finalCoverUrl,
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
