import { put } from '@vercel/blob';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import clientPromise from '../../../lib/mongodb';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({ multiples: false });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Handle both formats
    let pdfFile = files.pdf;
    if (Array.isArray(pdfFile)) pdfFile = pdfFile[0];

    if (!pdfFile || !pdfFile.filepath) {
      return res.status(400).json({ error: 'No PDF uploaded' });
    }

    const buffer = await fs.readFile(pdfFile.filepath);

    const blob = await put(
      `books/${Date.now()}-${pdfFile.originalFilename}`,
      buffer,
      { access: 'public' }
    );

    // Save to DB (safe fallback)
    try {
      const client = await clientPromise;
      const db = client.db('booknaija');

      await db.collection('books').insertOne({
        title: fields.title || 'Untitled',
        authorName: fields.authorName || 'Anonymous',
        pdfUrl: blob.url,
        createdAt: new Date(),
      });
    } catch (dbError) {
      console.error('DB error:', dbError);
    }

    return res.status(200).json({
      success: true,
      book: {
        title: fields.title,
        pdfUrl: blob.url,
      },
    });

  } catch (error) {
    console.error('UPLOAD ERROR:', error);

    return res.status(500).json({
      error: 'Upload failed',
      details: error.message,
    });
  }
}
