import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    // 1. Get ALL registered authors
    const authors = await db.collection('authors').find({}).toArray();
    
    let totalAuthorsFixed = 0;
    let totalBooksLinked = 0;
    const details = [];

    // 2. Loop through each author and fix their books
    for (const author of authors) {
      const cleanName = author.fullName.trim();
      
      // Update author's name in DB to remove trailing spaces
      await db.collection('authors').updateOne(
        { _id: author._id },
        { $set: { fullName: cleanName } }
      );

      // Find books that match this author's name (case-insensitive)
      const regex = new RegExp(cleanName.replace(/\s+/g, '.*'), 'i');
      const booksToUpdate = await db.collection('books').find({ 
        authorName: regex 
      }).toArray();

      let booksLinkedForThisAuthor = 0;
      for (const book of booksToUpdate) {
        // Only update if the email isn't already there
        if (book.authorEmail !== author.email) {
          await db.collection('books').updateOne(
            { _id: book._id },
            { $set: { authorEmail: author.email, authorName: cleanName } }
          );
          booksLinkedForThisAuthor++;
        }
      }

      if (booksLinkedForThisAuthor > 0 || cleanName !== author.fullName) {
        totalAuthorsFixed++;
        totalBooksLinked += booksLinkedForThisAuthor;
        details.push(`${author.fullName} -> ${booksLinkedForThisAuthor} books linked`);
      }
    }

    res.status(200).json({
      success: true,
      message: `✅ BULK FIX COMPLETE! Cleaned ${totalAuthorsFixed} author names and permanently linked ${totalBooksLinked} books to their emails.`,
      details
    });

  } catch (error) {
    console.error('Bulk fix error:', error);
    res.status(500).json({ error: error.message });
  }
}
