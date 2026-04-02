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
    console.log('Blob token:', !!process.env.BLOB_READ_WRITE_TOKEN ? 'SET' : 'MISSING');
    console.log('Mongo URI:', !!process.env.MONGODB_URI ? 'SET' : 'MISSING');

    const form = formidable({
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024,
      uploadDir: '/tmp'
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const title = fields.title?.[0] || 'Untitled Book';
    const authorName = fields.authorName?.[0] || 'Anonymous';
    const pdfFile = files.pdf?.[0];

    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    if (pdfFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({ 
        error: 'File too large',
        message: `Max 5MB allowed. Your file: ${(pdfFile.size / 1024 / 1024).toFixed(2)}MB`
      });
    }

    console.log(`📄 Uploading ${pdfFile.originalFilename} (${(pdfFile.size / 1024).toFixed(0)}KB)`);
    
    const pdfBuffer = await fs.readFile(pdfFile.filepath);
    const pdfBlob = await put(
      `books/${Date.now()}-${encodeURIComponent(pdfFile.originalFilename)}`,
      pdfBuffer,
      {
        access: 'public',
        contentType: 'application/pdf',
        addRandomSuffix: false
      }
    );
    await fs.unlink(pdfFile.filepath);

    console.log('✅ Blob upload successful');

    const client = await clientPromise;
    const db = client.db('booknaija');
    
    const book = await db.collection('books').insertOne({
      title,
      authorName,
      pdfUrl: pdfBlob.url,
      coverUrl: 'https://via.placeholder.com/400x600/667eea/ffffff?text=' + encodeURIComponent(title),
      status: 'published',
      stats: { 
        totalMinutesRead: 0,
        uniqueReaders: 0,
        totalReads: 0,
        readerIds: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ MongoDB save successful');
    
    res.status(200).json({ 
      success: true,
      message: '✅ Book uploaded successfully!',
      book: {
        id: book.insertedId,
        title,
        pdfUrl: pdfBlob.url,
        size: (pdfBuffer.length / 1024).toFixed(0) + ' KB'
      }
    });
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return res.status(504).json({ 
        error: 'Upload timeout',
        message: 'Connection too slow. Please try with smaller PDF (< 300KB) or better signal',
        fix: 'Use WiFi or move to area with stronger signal'
      });
    }
    
    if (error.message.includes('ECONNRESET') || error.message.includes('network')) {
      return res.status(503).json({ 
        error: 'Network error',
        message: 'Connection lost. Please check your internet and try again',
        fix: 'Wait 1 minute and retry upload'
      });
    }
    
    res.status(500).json({ 
      error: 'Upload failed',
      details: error.message
    });
  }
}
