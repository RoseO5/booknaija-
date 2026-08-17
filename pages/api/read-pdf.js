import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Book ID is required' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');
    const book = await db.collection('books').findOne({ _id: new ObjectId(id) });
    
    if (!book || !book.pdfUrl) return res.status(404).json({ error: 'Book or PDF not found' });

    console.log('📖 Proxying PDF from:', book.pdfUrl);
    const pdfResponse = await fetch(book.pdfUrl);
    
    if (!pdfResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch PDF from storage' });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Force browser to display inline
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${book.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('❌ PDF Proxy Error:', error);
    res.status(500).json({ error: 'Server Error: ' + error.message });
  }
}
