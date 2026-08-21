import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const client = await clientPromise;
  const db = client.db('booknaija');

  // 1. Get the author's registered full name
  const author = await db.collection('authors').findOne({ email });
  const registeredName = author ? author.fullName : 'Not Found';

  // 2. Find ALL books in the database (to see what's actually there)
  const allBooks = await db.collection('books').find({}).toArray();

  // 3. Find books matching the email
  const booksByEmail = await db.collection('books').find({ authorEmail: email }).toArray();

  // 4. Find books matching the name
  const booksByName = await db.collection('books').find({ authorName: registeredName }).toArray();

  res.status(200).json({
    yourEmail: email,
    registeredAuthorName: registeredName,
    totalBooksInDatabase: allBooks.length,
    booksFoundByEmail: booksByEmail.length,
    booksFoundByName: booksByName.length,
    detailsOfNameMatchedBooks: booksByName.map(b => ({ title: b.title, authorName: b.authorName, status: b.status }))
  });
}
