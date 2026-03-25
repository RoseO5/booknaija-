import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookId, bookTitle, minutesRead, pagesRead, userId } = req.body;
    const client = await clientPromise;
    const db = client.db('booknaija');

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Track reading session
    const session = await db.collection('reading_sessions').insertOne({
      userId: new ObjectId(userId),
      bookId: new ObjectId(bookId),
      bookTitle,
      minutesRead: parseInt(minutesRead),
      pagesRead: parseInt(pagesRead),
      month,
      createdAt: new Date()
    });

    // Update user stats - track unique books
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    const booksReadSet = user?.stats?.booksReadSet || [];
    
    if (!booksReadSet.includes(bookId)) {
      // First time reading this book
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $inc: { 
            'stats.booksRead': 1,
            'stats.totalMinutes': parseInt(minutesRead),
            'stats.uniqueBooksRead': 1
          },
          $push: { 'stats.booksReadSet': bookId },
          $set: { updatedAt: new Date() }
        }
      );
    } else {
      // Already read this book before
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $inc: { 
            'stats.totalMinutes': parseInt(minutesRead)
          },
          $set: { updatedAt: new Date() }
        }
      );
    }

    // Update book stats
    await db.collection('books').updateOne(
      { _id: new ObjectId(bookId) },
      { 
        $inc: { 
          'stats.totalMinutesRead': parseInt(minutesRead),
          'stats.totalReads': 1
        },
        $addToSet: { 'stats.readerIds': new ObjectId(userId) }
      }
    );

    // Update unique readers count
    const book = await db.collection('books').findOne({ _id: new ObjectId(bookId) });
    const uniqueReaders = book?.stats?.readerIds?.length || 0;
    
    await db.collection('books').updateOne(
      { _id: new ObjectId(bookId) },
      { $set: { 'stats.uniqueReaders': uniqueReaders } }
    );

    // Check prize eligibility (50 unique books in 6 months)
    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    const eligible = updatedUser.stats.uniqueBooksRead >= 50;
    
    if (eligible && !updatedUser.stats.eligibleForPrize) {
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { 'stats.eligibleForPrize': true } }
      );
    }

    res.status(200).json({ 
      success: true, 
      message: `✅ Reading tracked! ${minutesRead} mins, ${pagesRead} pages`,
      stats: {
        totalBooksRead: updatedUser.stats.booksRead,
        uniqueBooksRead: updatedUser.stats.uniqueBooksRead,
        totalMinutes: updatedUser.stats.totalMinutes,
        eligibleForPrize: eligible
      },
      prizeMessage: eligible 
        ? '🎉 Congratulations! You qualify for the ₦5,000 prize draw!'
        : `📚 ${50 - updatedUser.stats.uniqueBooksRead} more UNIQUE books to qualify for ₦5,000 prize!`
    });
  } catch (error) {
    console.error('Track reading error:', error);
    res.status(500).json({ error: 'Failed to track reading', details: error.message });
  }
}
