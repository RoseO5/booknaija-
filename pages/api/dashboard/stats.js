import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {   try {
const client = await clientPromise;
const db = client.db('booknaija');
const [
totalReaders,
activeSubscriptions,                              totalBooks,
eligibleForPrize,
totalReads,
totalMinutes
] = await Promise.all([                             db.collection('users').countDocuments({ role: 'reader' }),                                          db.collection('users').countDocuments({
role: 'reader',
'subscription.active': true
}),
db.collection('books').countDocuments({ status: 'published' }),
db.collection('users').countDocuments({
role: 'reader',
'stats.uniqueBooksRead': { $gte: 50 },
'stats.eligibleForPrize': true
}),
db.collection('reading_sessions').countDocuments(),
db.collection('reading_sessions').aggregate([
{ $group: { _id: null, total: { $sum: '$minutesRead' } } }
]).toArray()
]);

const totalMinutesValue = totalMinutes[0]?.total || 0;  

// Calculate revenue (test mode - no real money)  
const estimatedRevenue = activeSubscriptions * 1000;  
const authorPool = Math.floor(estimatedRevenue * 0.5);  
const platformRevenue = Math.floor(estimatedRevenue * 0.5);  
const prizePool = eligibleForPrize >= 3 ? 15000 : 0;  
const platformProfit = platformRevenue - prizePool;  

res.status(200).json({  
  success: true,  
  summary: {  
    totalReaders,  
    activeSubscriptions,  
    totalBooks,  
    totalReads,  
    totalMinutes: totalMinutesValue,  
    eligibleForPrize  
  },  
  revenue: {  
    estimatedMonthly: estimatedRevenue,  
    authorPool,  
    platformRevenue,  
    prizePool,  
    platformProfit  
  },  
  prizeStatus: {  
    canDraw: eligibleForPrize >= 3,  
    winnersNeeded: Math.max(0, 3 - eligibleForPrize),  
    nextDraw: eligibleForPrize >= 3  
      ? 'Ready to draw!'  
      : `${3 - eligibleForPrize} more readers needed`  
  },  
  authorPoolDistribution: {  
    method: '70% Minutes Read + 30% Unique Readers',  
    totalPool: authorPool,  
    note: 'Distributed monthly based on engagement metrics'  
  }  
});

} catch (error) {
console.error('Dashboard stats error:', error);
res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
}
}
