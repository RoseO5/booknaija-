import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Book ID is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    // 1. Find the book
    const book = await db.collection('books').findOne({ _id: new ObjectId(id) });
    if (!book || !book.pdfUrl) {
      return res.status(404).json({ error: 'Book or PDF not found' });
    }

    console.log('📖 Fetching PDF from Cloudinary for:', book.title);

    // 2. Fetch the PDF from Cloudinary on our secure server
    const pdfResponse = await fetch(book.pdfUrl);
    if (!pdfResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch PDF from storage' });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // 3. Set headers to FORCE the browser to display it inline (not download)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${book.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // 4. Send the PDF directly to the user's browser
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('❌ PDF Reader Error:', error);
    res.status(500).json({ error: 'Server Error: ' + error.message });
  }
}
