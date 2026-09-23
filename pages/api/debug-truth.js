import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

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
    
    const bookIdsString = books.map(b => b._id.toString());
    const bookIdsObject = books.map(b => new ObjectId(b._id));

    // 3. Check ALL reads by this user (ignoring 'completed' status to see what's there)
    const allUserReads = await db.collection('reads').find({ 
      userEmail: author.email 
    }).toArray();

    // 4. Check reads matching bookId as STRING
    const readsByStringId = await db.collection('reads').find({ 
      bookId: { $in: bookIdsString } 
    }).toArray();

    // 5. Check reads matching bookId as OBJECT ID
    const readsByObjectId = await db.collection('reads').find({ 
      bookId: { $in: bookIdsObject } 
    }).toArray();

    // 6. Return the raw truth
    res.status(200).json({
      status: 'success',
      authorFound: author.fullName,
      booksFoundCount: books.length,
      allReadsForThisUserCount: allUserReads.length,
      sampleUserRead: allUserReads.length > 0 ? { 
        bookId: allUserReads[0].bookId, 
        bookIdType: typeof allUserReads[0].bookId,
        completed: allUserReads[0].completed,
        timeSpent: allUserReads[0].timeSpent 
      } : 'none',
      readsMatchingStringId: readsByStringId.length,
      readsMatchingObjectId: readsByObjectId.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
