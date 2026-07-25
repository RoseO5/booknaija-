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

    // ✅ HARDCODED CREDENTIALS
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://147238a805856894e45ba2a6d6937939.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: '7523c68d529391a5534ed6bd9fbc06c3',
        secretAccessKey: '5a957f6a545e669c60008db9014a218abb2ab923a86183d04c2a872e1df02b6b',
      },
    });

    const urlObj = new URL(book.pdfUrl);
    const r2Key = urlObj.pathname.substring(1);

    const command = new GetObjectCommand({
      Bucket: 'booknaija-pdfs',
      Key: r2Key,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    res.status(200).json({ url: presignedUrl });

  } catch (error) {
    console.error('❌ BOOK ACCESS ERROR:', error);
    res.status(500).json({ error: `Server Error: ${error.message}` });
  }
}
