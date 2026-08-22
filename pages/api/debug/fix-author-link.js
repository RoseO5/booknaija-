import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const client = await clientPromise;
  const db = client.db('booknaija');

  const author = await db.collection('authors').findOne({ email });
  if (!author) return res.status(404).json({ error: 'Author not found' });

  const cleanName = author.fullName.trim();
  
  await db.collection('authors').updateOne(
    { email },
    { $set: { fullName: cleanName } }
  );

  const regex = new RegExp(cleanName, 'i');
  const booksToUpdate = await db.collection('books').find({ 
    authorName: regex 
  }).toArray();

  let updatedCount = 0;
  for (const book of booksToUpdate) {
    await db.collection('books').updateOne(
      { _id: book._id },
      { $set: { authorEmail: email, authorName: cleanName } }
    );
    updatedCount++;
  }

  res.status(200).json({
    success: true,
    message: `✅ Fixed! Cleaned name to "${cleanName}" and linked ${updatedCount} books to your email. Refresh your dashboard!`,
    updatedCount
  });
}
