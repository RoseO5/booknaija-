import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ✅ Clean version: Uses environment variables from Vercel (no hardcoded Account ID)
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

    const key = `books/${Date.now()}_${filename}`;

    // ✅ FIX: Removed ContentType to prevent presigned URL signature mismatch
    const command = new PutObjectCommand({
      Bucket: 'booknaija-pdfs',
      Key: key
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    // ✅ Dynamic public URL using the environment variable
    const publicUrl = `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;

    res.status(200).json({ uploadUrl, publicUrl, key });
  } catch (error) {
    console.error('URL Gen Error:', error);
    res.status(500).json({ error: error.message });
  }
}
