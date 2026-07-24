import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client } from '@aws-sdk/client-s3';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// Initialize R2 client
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { bookId, userEmail } = req.query;

  try {
    // 1. Verify user has active subscription
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    const user = await db.collection('users').findOne({ email: userEmail });
    
    if (!user || !user.subscription?.active) {
      return res.status(403).json({ error: 'Active subscription required' });
    }

    // 2. Get the book from database
    const book = await db.collection('books').findOne({ _id: new ObjectId(bookId) });
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // 3. Extract the R2 key from the stored URL
    // The pdfUrl is like: https://<account>.r2.cloudflarestorage.com/bucket-name/path/to/file.pdf
    // We need just: path/to/file.pdf
    const urlParts = book.pdfUrl.split('/');
    const r2Key = urlParts.slice(4).join('/'); // Skip protocol, domain, and bucket name

    // 4. Generate a presigned URL that expires in 1 hour
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: r2Key,
    });

    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 }); // 1 hour

    res.status(200).json({ url: presignedUrl });

  } catch (error) {
    console.error('Book access error:', error);
    res.status(500).json({ error: 'Failed to generate access link' });
  }
}
