import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    const emailToCheck = 'talktorose90@gmail.com';
    
    // 1. Find Author
    const author = await db.collection('authors').findOne({ 
      email: { $regex: new RegExp(`^${emailToCheck}$`, 'i') } 
    });

    if (!author) {
      return res.status(200).json({ step: 1, error: 'Author not found in database' });
    }

    // 2. Find Books
    const cleanName = author.fullName.trim().replace(/\s+/g, ' ');
    const nameRegex = new RegExp(cleanName.split(' ').join('.*'), 'i');
    
    const books = await db.collection('books').find({
      $or: [{ authorEmail: author.email }, { authorName: nameRegex }]
    }).toArray();
    
    const bookIds = books.map(b => b._id.toString());

    // 3. Check Reads by bookId (How the API currently does it)
    const readsByBookId = await db.collection('reads').aggregate([
      { $match: { bookId: { $in: bookIds }, completed: true } },
      { $group: { _id: null, totalReads: { $sum: 1 }, totalTime: { $sum: '$timeSpent' } } }
    ]).toArray();

    // 4. Check Reads by userEmail (Direct check)
    const readsByUserEmail = await db.collection('reads').find({ 
      userEmail: author.email, 
      completed: true 
    }).toArray();

    // 5. Return the raw truth
    res.status(200).json({
      status: 'success',
      authorFound: { name: author.fullName, email: author.email },
      booksFoundCount: books.length,
      bookIdsSample: bookIds.slice(0, 3),
      readsMatchedByBookId: readsByBookId.length > 0 ? readsByBookId[0] : '0 reads found',
      directReadsByUserEmailCount: readsByUserEmail.length,
      sampleReadBookId: readsByUserEmail.length > 0 ? { id: readsByUserEmail[0].bookId, type: typeof readsByUserEmail[0].bookId } : 'none'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
