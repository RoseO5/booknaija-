import { put } from '@vercel/blob';
import { promises as fs } from 'fs';
import formidable from 'formidable';
import clientPromise from '../../../lib/mongodb';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Upload started');

    const form = formidable({
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024,
      uploadDir: '/tmp',
      multiples: false,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const title = fields.title || 'Untitled Book';
    const authorName = fields.authorName || 'Anonymous';
    const description = fields.description || '';
    const pages = Number(fields.pages || 0);

    const pdfFile = files.pdf;

    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    console.log(`📄 Uploading: ${pdfFile.originalFilename}`);

    const pdfBuffer = await fs.readFile(pdfFile.filepath);

    const blob = await put(
      `books/${Date.now()}-${pdfFile.originalFilename}`,
      pdfBuffer,
      {
        access: 'public',
        contentType: 'application/pdf',
      }
    );

    await fs.unlink(pdfFile.filepath);

    const client = await clientPromise;
    const db = client.db('booknaija');

    const result = await db.collection('books').insertOne({
      title,
      authorName,
      description,
      pages,
      pdfUrl: blob.url,
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      book: {
        id: result.insertedId,
        title,
        pdfUrl: blob.url,
        size: (pdfBuffer.length / 1024).toFixed(0) + ' KB',
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
