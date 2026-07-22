import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, name, reference } = req.body;

    if (!email || !reference) {
      return res.status(400).json({ error: 'Email and Transaction Reference are required.' });
    }

    const cleanRef = reference.trim().toUpperCase();

    const client = await clientPromise;
    const db = client.db('booknaija');

    // 🛡️ SECURITY CHECK 1: Has this reference ALREADY been used by anyone?
    const existingPayment = await db.collection('users').findOne({ 
      "subscription.transactionRef": cleanRef 
    });

    if (existingPayment) {
      return res.status(400).json({ 
        error: '❌ This transaction reference has already been used. Please use a new, valid reference.' 
      });
    }

    // 🛡️ SECURITY CHECK 2: Verify with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${cleanRef}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const paystackData = await paystackRes.json();

    // 🛡️ SECURITY CHECK 3: Ensure Paystack says it's successful AND the amount is correct (₦1000 = 100000 kobo)
    if (paystackData.status && paystackData.data?.amount >= 100000 && paystackData.data?.currency === 'NGN') {
      
      await db.collection('users').updateOne(
        { email },
        {
          $set: {
            name: name || 'Reader',
            role: 'reader',
            subscription: {
              active: true,
              status: 'active',
              paymentMethod: 'paystack',
              transactionRef: cleanRef,
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // ✅ FIXED: 1 Month (30 days)
              amount: 1000
            },
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: '✅ Payment verified! Your 1-month premium access is now active.',
        autoApproved: true
      });
    }

    // If Paystack doesn't recognize it or it failed
    return res.status(400).json({ 
      error: '❌ Transaction reference not found, failed, or amount is incorrect in Paystack. Please ensure you completed the payment and use the exact reference provided.' 
    });

  } catch (error) {
    console.error('Verify transfer error:', error);
    res.status(500).json({ error: 'Failed to verify payment', details: error.message });
  }
}
