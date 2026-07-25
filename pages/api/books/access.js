import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { bookId, userEmail } = req.query;

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    const user = await db.collection('users').findOne({ email: userEmail });
    if (!user) return res.status(403).json({ error: 'User not found.' });
    if (!user.subscription?.active) return res.status(403).json({ error: 'Active subscription required.' });

    const book = await db.collection('books').findOne({ _id: new ObjectId(bookId) });
    if (!book || !book.pdfUrl) return res.status(404).json({ error: 'Book or PDF not found.' });

    // ✅ LOG CREDENTIAL STATUS (masked for security)
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKey = process.env.R2_ACCESS_KEY_ID;
    const secretKey = process.env.R2_SECRET_ACCESS_KEY;

    console.log('🔐 Credential Check:', {
      accountId: accountId ? `✅ ${accountId.substring(0, 8)}...` : '❌ Missing',
      accessKey: accessKey ? `✅ ${accessKey.substring(0, 8)}...` : '❌ Missing',
      secretKey: secretKey ? `✅ ${secretKey.substring(0, 8)}...` : '❌ Missing',
    });

    if (!accountId || !accessKey || !secretKey) {
      return res.status(500).json({ error: 'Missing R2 credentials' });
    }

    // ✅ Initialize S3Client with explicit credential structure
    let r2Client;
    try {
      r2Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
      });
      console.log('✅ S3Client initialized successfully');
    } catch (clientError) {
      console.error('❌ S3Client initialization failed:', clientError);
      return res.status(500).json({ error: `S3Client init error: ${clientError.message}` });
    }

    const urlObj = new URL(book.pdfUrl);
    const r2Key = urlObj.pathname.substring(1);
    console.log('📁 Extracted R2 Key:', r2Key);

    const command = new GetObjectCommand({
      Bucket: 'booknaija-pdfs',
      Key: r2Key,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    console.log('✅ Presigned URL generated successfully');
    
    res.status(200).json({ url: presignedUrl });

  } catch (error) {
    console.error('❌ BOOK ACCESS ERROR:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: `Server Error: ${error.message}` });
  }
}
