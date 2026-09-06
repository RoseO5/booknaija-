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
      // Count published books by this author
      const totalBooks = await db.collection('books').countDocuments({
        authorEmail: author.email,
        status: 'published'
      });
      
      // Get all book IDs by this author
      const authorBooks = await db.collection('books').find({
        authorEmail: author.email,
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
      
      // Calculate earnings based on reading time share
      // (Same logic as /api/authors/earnings.js)
      let earnings = 0;
      if (totalTimeSpent > 0) {
        // Get total platform reading time
        const platformAgg = await db.collection('reads').aggregate([
          { $match: { completed: true } },
          { $group: { _id: null, total: { $sum: '$timeSpent' } } }
        ]).toArray();
        
        const platformTotalTime = platformAgg.length > 0 ? platformAgg[0].total : 0;
        
        if (platformTotalTime > 0) {
          // Get monthly revenue (estimate based on active subscribers)
          const activeSubscribers = await db.collection('users').countDocuments({
            'subscription.active': true
          });
          
          const monthlyRevenue = activeSubscribers * 1000; // ₦1000 per subscriber
          const authorPool = monthlyRevenue * 0.5; // 50% goes to authors
          
          // Author's share = (their time / total time) * author pool
          earnings = Math.round((totalTimeSpent / platformTotalTime) * authorPool);
        }
      }
      
      return {
        ...author,
        totalBooks,
        totalReads,
        totalTimeSpent,
        earnings
      };
    }));
    
    res.status(200).json({ success: true, authors: authorsWithStats });
  } catch (error) {
    console.error('Authors list error:', error);
    res.status(500).json({ error: error.message });
  }
}
