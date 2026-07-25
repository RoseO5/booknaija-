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

    // ✅ FINAL CORRECT VARIABLE NAMES FROM VERCEL DASHBOARD
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
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
