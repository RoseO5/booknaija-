import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  try {
    const { filename } = req.query;
    if (!filename) return res.status(400).json({ error: 'Filename required' });

    // Create a unique path for the file
    const key = `books/${Date.now()}_${filename}`;

    // ✅ FIXED: Removed ACL: 'public-read' because Cloudflare R2 does not support it.
    // R2 uses bucket-level public access (via the pub-...r2.dev domain) instead.
    const command = new PutObjectCommand({
      Bucket: 'booknaija-pdfs',
      Key: key,
      ContentType: 'application/pdf'
    });

    // Generate a link valid for 1 hour
    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    // The public URL where the book will live after upload
    const publicUrl = `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;

    res.status(200).json({ uploadUrl, publicUrl, key });
  } catch (error) {
    console.error('URL Gen Error:', error);
    res.status(500).json({ error: error.message });
  }
}
// Fixed R2 Account ID length
