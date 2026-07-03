import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    // Get all stats
    const [
      totalReaders,
      activeSubscriptions,
      totalBooks,
      totalReads,
      totalMinutes,
      authors
    ] = await Promise.all([
      db.collection('users').countDocuments({ role: 'reader' }),
      db.collection('users').countDocuments({ role: 'reader', 'subscription.active': true }),
      db.collection('books').countDocuments({ status: 'published' }),
      db.collection('reads').countDocuments({ completed: true }),
      db.collection('reads').aggregate([
        { $group: { _id: null, total: { $sum: '$timeSpent' } } }
      ]).toArray(),
      db.collection('authors').find({}).toArray()
    ]);

    const totalMinutesValue = Math.floor((totalMinutes[0]?.total || 0) / 60);

    // Calculate revenue
    const estimatedRevenue = activeSubscriptions * 1000;
    const authorPool = Math.floor(estimatedRevenue * 0.5);
    const platformRevenue = Math.floor(estimatedRevenue * 0.5);
    
    // Prize pool logic
    const eligibleReaders = await db.collection('users').countDocuments({
      role: 'reader',
      'subscription.active': true,
      'stats.uniqueBooksRead': { $gte: 50 }
    });
    
    const prizePool = eligibleReaders >= 3 ? 15000 : 0;
    const platformProfit = platformRevenue - prizePool;

    // Calculate individual author earnings
    const authorEarnings = await Promise.all(authors.map(async (author) => {
      const authorBooks = await db.collection('books').find({ 
        authorEmail: author.email,
        status: 'published'
      }).toArray();
      
      const bookIds = authorBooks.map(b => b._id);
      
      // Get reads for author's books
      const reads = await db.collection('reads').aggregate([
        { $match: { bookId: { $in: bookIds }, completed: true } },
        { $group: { 
            _id: null, 
            totalReads: { $sum: 1 },
            totalTime: { $sum: '$timeSpent' },
            uniqueReaders: { $addToSet: '$userId' }
        }}
      ]).toArray();

      const totalReads = reads[0]?.totalReads || 0;
      const totalTime = reads[0]?.totalTime || 0;
      const uniqueReaders = reads[0]?.uniqueReaders?.length || 0;

      // Calculate share (will be computed in distribution)
      return {
        authorId: author._id,
        name: author.fullName,
        email: author.email,
        books: authorBooks.length,
        totalReads,
        totalTime: Math.floor(totalTime / 60),
        uniqueReaders,
        bankDetails: {
          bank: author.bankName,
          account: author.accountNumber,
          name: author.accountName
        }
      };
    }));

    // Calculate distribution
    const totalReadsAll = authorEarnings.reduce((sum, a) => sum + a.totalReads, 0);
    const totalReadersAll = authorEarnings.reduce((sum, a) => sum + a.uniqueReaders, 0);

    const authorDistribution = authorEarnings.map(author => {
      const readsShare = totalReadsAll > 0 ? (author.totalReads / totalReadsAll) * 0.7 : 0;
      const readersShare = totalReadersAll > 0 ? (author.uniqueReaders / totalReadersAll) * 0.3 : 0;
      const share = readsShare + readersShare;
      const earnings = Math.floor(authorPool * share);

      return {
        ...author,
        readsShare: (readsShare * 100).toFixed(2),
        readersShare: (readersShare * 100).toFixed(2),
        totalShare: (share * 100).toFixed(2),
        earnings
      };
    });

    // Sort by earnings
    authorDistribution.sort((a, b) => b.earnings - a.earnings);

    const report = {
      success: true,
      generatedAt: new Date().toISOString(),
      summary: {
        totalReaders,
        activeSubscriptions,
        totalBooks,
        totalReads,
        totalMinutes: totalMinutesValue,
        eligibleForPrize: eligibleReaders
      },
      revenue: {
        estimatedMonthly: estimatedRevenue,
        authorPool,
        platformRevenue,
        prizePool,
        platformProfit
      },
      authorDistribution,
      prizeStatus: {
        canDraw: eligibleReaders >= 3,
        winnersNeeded: Math.max(0, 3 - eligibleReaders),
        nextDraw: eligibleReaders >= 3 ? 'Ready to draw!' : `${3 - eligibleReaders} more readers needed`
      }
    };

    // If POST request, send email (placeholder - integrate with email service)
    if (req.method === 'POST') {
      // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
      console.log('Revenue report generated:', report);
      // await sendEmail('your-email@example.com', 'Monthly Revenue Report', JSON.stringify(report, null, 2));
    }

    res.status(200).json(report);
  } catch (error) {
    console.error('Revenue calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate revenue', details: error.message });
  }
}
