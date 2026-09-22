import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    // 1. Get all registered authors
    const authors = await db.collection('authors').find({}).sort({ createdAt: -1 }).toArray();

    // 2. For each author, calculate their real stats
    const authorsWithStats = await Promise.all(authors.map(async (author) => {
      
      // ✅ FIX 1: Flexible name matching for accurate book count
      const cleanName = author.fullName.trim().replace(/\s+/g, ' ');
      const nameWords = cleanName.split(' ');
      const flexibleNameRegex = new RegExp(nameWords.join('.*'), 'i');

      const totalBooks = await db.collection('books').countDocuments({
        $or: [
          { authorEmail: author.email },
          { authorName: flexibleNameRegex }
        ],
        status: 'published'
      });

      // Get all book IDs by this author (using the same flexible matching)
      const authorBooks = await db.collection('books').find({
        $or: [
          { authorEmail: author.email },
          { authorName: flexibleNameRegex }
        ],
        status: 'published'
      }).project({ _id: 1 }).toArray();

      const bookIds = authorBooks.map(b => b._id);

      // Count total reads (completed) across all their books
      let totalReads = 0;
      let totalTimeSpent = 0;

      if (bookIds.length > 0) {
        const readsAgg = await db.collection('reads').aggregate([
          { $match: { bookId: { $in: bookIds }, completed: true } },
          { $group: {
              _id: null,
              totalReads: { $sum: 1 },
              totalTime: { $sum: '$timeSpent' }
          }}
        ]).toArray();

        if (readsAgg.length > 0) {
          totalReads = readsAgg[0].totalReads;
          totalTimeSpent = readsAgg[0].totalTime;
        }
      }

      // --- COMPREHENSIVE EARNINGS CALCULATION ---

      // 1. Calculate Reading earnings (Original logic preserved)
      let readingEarnings = 0;
      if (totalTimeSpent > 0) {
        const platformAgg = await db.collection('reads').aggregate([
          { $match: { completed: true } },
          { $group: { _id: null, total: { $sum: '$timeSpent' } } }
        ]).toArray();

        const platformTotalTime = platformAgg.length > 0 ? platformAgg[0].total : 0;

        if (platformTotalTime > 0) {
          const activeSubscribers = await db.collection('users').countDocuments({
            'subscription.active': true
          });
          const monthlyRevenue = activeSubscribers * 1000; // ₦1000 per subscriber
          const authorPool = monthlyRevenue * 0.5; // 50% goes to authors
          readingEarnings = Math.round((totalTimeSpent / platformTotalTime) * authorPool);
        }
      }

      // 2. Add Unlocks and Tips (Already saved in the author's document)
      const coinUnlockEarnings = author.earnings?.coinUnlocks || 0;
      const tipEarnings = author.earnings?.tips || 0;

      // 3. Calculate Trivia Earnings for THIS author dynamically
      let triviaEarnings = 0;
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const tournament = await db.collection('trivia_entries').findOne({ month: currentMonth });
      const config = await db.collection('trivia_config').findOne({ month: currentMonth });

      if (tournament && config && config.featuredBooks) {
        const totalPool = tournament.totalPoolNaira || 0;
        const authorPoolTrivia = Math.floor(totalPool * 0.10); // 10% for authors
        const featuredBooksByThisAuthor = config.featuredBooks.filter(b => b.authorEmail === author.email);

        if (featuredBooksByThisAuthor.length > 0) {
          const perAuthor = Math.floor(authorPoolTrivia / config.featuredBooks.length);
          triviaEarnings = featuredBooksByThisAuthor.length * perAuthor;
        }
      }

      // 4. Total all categories together
      const totalEarnings = readingEarnings + coinUnlockEarnings + tipEarnings + triviaEarnings;

      // ✅ FIX 2: Return the breakdown so the UI can display it
      return {
        ...author,
        totalBooks,
        totalReads,
        totalTimeSpent,
        earnings: totalEarnings,
        earningsBreakdown: {
          reading: readingEarnings,
          unlocks: coinUnlockEarnings,
          tips: tipEarnings,
          trivia: triviaEarnings
        }
      };
    }));

    res.status(200).json({ success: true, authors: authorsWithStats });
  } catch (error) {
    console.error('Authors list error:', error);
    res.status(500).json({ error: error.message });
  }
}
