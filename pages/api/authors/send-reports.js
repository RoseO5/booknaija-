import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    // Get all authors
    const authors = await db.collection('authors').find({}).toArray();

    if (authors.length === 0) {
      return res.status(200).json({ success: true, sent: 0, failed: 0, details: { sent: [], failed: [] } });
    }

    // Platform Stats
    const activeSubscriptions = await db.collection('users').countDocuments({ 'subscription.active': true });
    const monthlyRevenue = activeSubscriptions * 1000;
    const authorPool = monthlyRevenue * 0.5; // 50% to authors

    const platformAgg = await db.collection('reads').aggregate([
      { $match: { completed: true } },
      { $group: { _id: null, total: { $sum: '$timeSpent' } } }
    ]).toArray();
    const platformTotalTime = platformAgg.length > 0 ? platformAgg[0].total : 1;

    const sentReports = [];
    const failedReports = [];

    for (const author of authors) {
      // Skip authors without a valid email
      if (!author.email || !author.email.includes('@')) {
        failedReports.push({ name: author.fullName || 'Unknown', email: author.email || 'Missing', reason: 'Invalid or missing email address' });
        continue;
      }

      try {
        // 1. Find books (Flexible matching, just like dashboard)
        const cleanName = author.fullName ? author.fullName.trim().replace(/\s+/g, ' ') : '';
        const nameWords = cleanName.split(' ');
        const flexibleNameRegex = new RegExp(nameWords.join('.*'), 'i');

        const books = await db.collection('books').find({
          $or: [{ authorEmail: author.email }, { authorName: flexibleNameRegex }],
          status: 'published'
        }).toArray();

        const bookIds = books.map(b => b._id);

        // 2. Calculate NEW 100% time-based earnings
        let totalTime = 0;
        let totalReads = 0;
        if (bookIds.length > 0) {
          const readsAgg = await db.collection('reads').aggregate([
            { $match: { bookId: { $in: bookIds }, completed: true } },
            { $group: { _id: null, totalTime: { $sum: '$timeSpent' }, totalReads: { $sum: 1 } } }
          ]).toArray();
          if (readsAgg.length > 0) {
            totalTime = readsAgg[0].totalTime;
            totalReads = readsAgg[0].totalReads;
          }
        }

        let readingEarnings = 0;
        if (totalTime > 0 && platformTotalTime > 0) {
          readingEarnings = Math.round((totalTime / platformTotalTime) * authorPool);
        }

        // Add other earnings
        const coinUnlockEarnings = author.earnings?.coinUnlocks || 0;
        const tipEarnings = author.earnings?.tips || 0;
        const triviaEarnings = author.earnings?.trivia || 0;
        const totalEarnings = readingEarnings + coinUnlockEarnings + tipEarnings + triviaEarnings;

        // 3. Send Email via Resend
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0;">📚 BookNaija</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Monthly Author Earnings Report</p>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #eee;">
              <p style="font-size: 18px; color: #333;">Hello <strong>${author.fullName}</strong>,</p>
              <p style="color: #666;">Here's your earnings report for this month:</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <div style="font-size: 14px; color: #666;">Your Total Earnings</div>
                <div style="font-size: 36px; font-weight: bold; color: #28a745; margin: 10px 0;">₦${totalEarnings.toLocaleString()}</div>
              </div>
              <h3 style="color: #333;">📊 Your Stats</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; color: #666;">Books Published</td><td style="padding: 10px; text-align: right; font-weight: bold;">${books.length}</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px; color: #666;">Total Completed Reads</td><td style="padding: 10px; text-align: right; font-weight: bold;">${totalReads}</td></tr>
                <tr><td style="padding: 10px; color: #666;">Total Reading Minutes</td><td style="padding: 10px; text-align: right; font-weight: bold;">${Math.floor(totalTime / 60)}</td></tr>
              </table>
              <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #004085; font-size: 14px;">💳 <strong>Note:</strong> Earnings are calculated 100% based on completed reading minutes. Payments are processed monthly to your registered bank account.</p>
              </div>
              <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">Thank you for being part of BookNaija! 📚💚</p>
            </div>
          </div>
        `;

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'BookNaija <onboarding@resend.dev>', // Update to your verified domain later (e.g., reports@booknaija.com)
            to: author.email,
            subject: `📚 Your BookNaija Earnings: ₦${totalEarnings.toLocaleString()}`,
            html: emailHtml
          })
        });

        if (response.ok) {
          sentReports.push({ name: author.fullName, email: author.email, earnings: totalEarnings });
        } else {
          const errorData = await response.json();
          failedReports.push({ name: author.fullName, email: author.email, reason: errorData.message || 'Resend API error' });
        }

        // 1-second delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        failedReports.push({ name: author.fullName, email: author.email, reason: error.message });
      }
    }

    res.status(200).json({
      success: true,
      sent: sentReports.length,
      failed: failedReports.length,
      total: authors.length,
      details: { sent: sentReports, failed: failedReports }
    });
  } catch (error) {
    console.error('Send reports error:', error);
    res.status(500).json({ error: error.message });
  }
}
