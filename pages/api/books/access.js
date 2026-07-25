import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { bookId, userEmail } = req.query;

  try {
    // 1. Verify user exists and has an active subscription
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    const user = await db.collection('users').findOne({ email: userEmail });
    if (!user) {
      return res.status(403).json({ error: 'User not found. Please log in again.' });
    }
    
    if (!user.subscription?.active) {
      return res.status(403).json({ error: 'Active subscription required. Please subscribe to read.' });
    }

    // 2. Find the book
    const book = await db.collection('books').findOne({ _id: new ObjectId(bookId) });
    if (!book || !book.pdfUrl) {
      return res.status(404).json({ error: 'Book or PDF not found.' });
    }

    // 3. Initialize Cloudflare R2 Client with HARDCODED Account ID
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: 'https://147238a805856894e45ba2a6d6937939.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    // 4. Extract the exact file key from the URL safely
    const urlObj = new URL(book.pdfUrl);
    const r2Key = urlObj.pathname.substring(1);

    // 5. Generate a secure, temporary link (valid for 1 hour)
    const command = new GetObjectCommand({
      Bucket: 'booknaija-pdfs',
      Key: r2Key,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    // 6. Return the secure link to the frontend
    res.status(200).json({ url: presignedUrl });

  } catch (error) {
    console.error('❌ BOOK ACCESS ERROR:', error);
    res.status(500).json({ error: `Server Error: ${error.message}` });
  }
}
