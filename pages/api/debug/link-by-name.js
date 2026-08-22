import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  const { email, name } = req.query;
  if (!email || !name) return res.status(400).json({ error: 'Email and name required' });

  const client = await clientPromise;
  const db = client.db('booknaija');

  // 1. Clean the name (remove trailing spaces)
  const cleanName = name.trim();

  // 2. Update the author's profile name to match exactly
  await db.collection('authors').updateOne(
    { email },
    { $set: { fullName: cleanName } }
  );

  // 3. Find books with this name (case-insensitive, flexible spaces)
  const regex = new RegExp(cleanName.replace(/\s+/g, '\\s*'), 'i');
  
  // 4. Link those books to the author's email
  const result = await db.collection('books').updateMany(
    { authorName: regex },
    { $set: { authorEmail: email, authorName: cleanName } }
  );

  res.status(200).json({
    success: true,
    message: `✅ Fixed! Linked ${result.modifiedCount} books to ${email}.`,
    modifiedCount: result.modifiedCount
  });
}
