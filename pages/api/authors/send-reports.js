import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    // Get all authors
    const authors = await db.collection('authors').find({}).toArray();

    if (authors.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No authors to send reports to',
        sent: 0 
      });
    }

    // Get platform stats
    const activeSubscriptions = await db.collection('users').countDocuments({
      role: 'reader',
      'subscription.active': true
    });

    const estimatedRevenue = activeSubscriptions * 1000;
    const authorPool = Math.floor(estimatedRevenue * 0.5);

    // Get all reads for calculation
    const allReads = await db.collection('reads').aggregate([
      { $match: { completed: true } },
      { $group: { 
          _id: null, 
          totalTime: { $sum: '$timeSpent' },
          uniqueReaders: { $addToSet: '$userId' }
      }}
    ]).toArray();

    const platformTotalTime = allReads[0]?.totalTime || 1;
    const platformUniqueReaders = allReads[0]?.uniqueReaders?.length || 1;

    // Calculate earnings for each author
    const reports = await Promise.all(authors.map(async (author) => {
      const books = await db.collection('books').find({ 
        authorEmail: author.email,
        status: 'published'
      }).toArray();

      const bookIds = books.map(b => b._id);

      const reads = await db.collection('reads').aggregate([
        { $match: { bookId: { $in: bookIds }, completed: true } },
        { $group: { 
            _id: null, 
            totalTime: { $sum: '$timeSpent' },
            uniqueReaders: { $addToSet: '$userId' }
        }}
      ]).toArray();

      const totalTime = reads[0]?.totalTime || 0;
      const uniqueReaders = reads[0]?.uniqueReaders?.length || 0;

      const minutesShare = (totalTime / platformTotalTime) * 0.7;
      const readersShare = (uniqueReaders / platformUniqueReaders) * 0.3;
      const totalShare = minutesShare + readersShare;
      const earnings = Math.floor(authorPool * totalShare);

      return {
        email: author.email,
        name: author.fullName,
        books: books.length,
        reads: reads[0]?.totalReads || 0,
        minutes: Math.floor(totalTime / 60),
        uniqueReaders,
        earnings,
        breakdown: {
          minutesShare: (minutesShare * 100).toFixed(2),
          readersShare: (readersShare * 100).toFixed(2)
        }
      };
    }));

    // Send emails (using Resend - free tier: 3000 emails/month)
    const sentReports = [];
    
    for (const report of reports) {
      try {
        // Email content
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0;">📚 BookNaija</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Monthly Author Earnings Report</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #eee;">
              <p style="font-size: 18px; color: #333;">Hello <strong>${report.name}</strong>,</p>
              
              <p style="color: #666;">Here's your earnings report for this month:</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <div style="font-size: 14px; color: #666;">Your Earnings</div>
                <div style="font-size: 36px; font-weight: bold; color: #28a745; margin: 10px 0;">
                  ₦${report.earnings.toLocaleString()}
                </div>
              </div>
              
              <h3 style="color: #333; margin-top: 30px;">📊 Your Stats</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; color: #666;">Books Published</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold;">${report.books}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; color: #666;">Total Reads</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold;">${report.reads}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; color: #666;">Minutes Read</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold;">${report.minutes}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; color: #666;">Unique Readers</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold;">${report.uniqueReaders}</td>
                </tr>
              </table>
              
              <h3 style="color: #333; margin-top: 30px;">💰 Earnings Breakdown</h3>
              <p style="color: #666; font-size: 14px;">Your earnings are calculated based on:</p>
              <ul style="color: #666; line-height: 1.8;">
                <li><strong>70%</strong> from total minutes readers spent on your books (${report.breakdown.minutesShare}%)</li>
                <li><strong>30%</strong> from unique readers who read your books (${report.breakdown.readersShare}%)</li>
              </ul>
              
              <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #004085; font-size: 14px;">
                  💳 Payment will be sent to your registered bank account within 7 days.
                </p>
              </div>
              
              <p style="color: #666; margin-top: 30px;">
                View your full dashboard anytime at:<br/>
                <a href="https://booknaija.vercel.app/author-dashboard" style="color: #667eea; font-weight: bold;">
                  https://booknaija.vercel.app/author-dashboard
                </a>
              </p>
              
              <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
                Thank you for being part of BookNaija! 📚💚
              </p>
            </div>
          </div>
        `;

        // Send via Resend (free email service)
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'BookNaija <onboarding@resend.dev>',
            to: report.email,
            subject: `📚 Your BookNaija Earnings: ₦${report.earnings.toLocaleString()}`,
            html: emailHtml
          })
        });

        if (response.ok) {
          sentReports.push({ email: report.email, name: report.name, earnings: report.earnings });
        }
      } catch (error) {
        console.error(`Failed to send to ${report.email}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      sent: sentReports.length,
      total: authors.length,
      reports: sentReports
    });
  } catch (error) {
    console.error('Send reports error:', error);
    res.status(500).json({ error: error.message });
  }
}
