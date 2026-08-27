import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const client = await clientPromise;
    const db = client.db('booknaija');

    // ✅ AUTO-CLEANUP: Remove abandoned pending references older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await db.collection('users').updateMany(
      {
        'subscription.pendingReference': { $exists: true },
        'subscription.paidAt': { $lt: sevenDaysAgo },
        'subscription.active': { $ne: true }
      },
      {
        $unset: { 'subscription.pendingReference': '' }
      }
    );

    // 1. Get the stored reference from database
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    
    if (!user?.subscription?.pendingReference) {
      return res.status(400).json({ error: 'No pending payment found. Please start a new payment.' });
    }

    const reference = user.subscription.pendingReference;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error('❌ PAYSTACK_SECRET_KEY missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 2. Verify with Paystack using the stored reference
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { 
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();

    if (!data.status || data.data.status !== 'success') {
      return res.status(400).json({ 
        error: 'Payment not confirmed yet. If you used bank transfer, please wait 1-5 minutes and try again.' 
      });
    }

    // 3. Activate subscription
    const accessCard = `BN-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          'subscription.active': true,
          'subscription.accessCard': accessCard,
          'subscription.reference': reference,
          'subscription.amount': data.data.amount / 100,
          'subscription.paidAt': new Date(),
          'subscription.expiresAt': new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
          role: 'reader'
        },
        $unset: { 'subscription.pendingReference': '' } // Remove pending reference immediately
      }
    );

    res.status(200).json({ 
      success: true, 
      accessCard,
      expiresAt: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')
    });
    
  } catch (error) {
    console.error('💥 Verify error:', error);
    res.status(500).json({ error: 'Failed to verify payment. Please try again.' });
  }
}
