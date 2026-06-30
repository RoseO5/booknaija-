import crypto from 'crypto';
import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: 'Reference required' });

    // 1. Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    const data = await response.json();

    if (!data.status || data.data.status !== 'success') {
      return res.status(400).json({ 
        error: 'Payment not successful',
        details: data.data?.gateway_response || 'Unknown'
      });
    }

    // 2. Extract payment details
    const email = data.data.customer.email;
    const amount = data.data.amount / 100; // kobo to Naira

    // 3. Generate access card
    const accessCard = `BN-${Date.now()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // 4. Activate subscription in MongoDB
    const client = await clientPromise;
    const db = client.db('booknaija');

    await db.collection('users').updateOne(
      { email },
      {
        $set: {
          email,
          'subscription.active': true,
          'subscription.plan': 'reader-premium',
          'subscription.provider': 'paystack',
          'subscription.accessCard': accessCard,
          'subscription.reference': reference,
          'subscription.expiresAt': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          'subscription.lastPaymentAt': new Date()
        },
        $setOnInsert: {
          role: 'reader',
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    // 5. Log payment
    await db.collection('payments').insertOne({
      email,
      reference,
      amount,
      currency: 'NGN',
      provider: 'paystack',
      status: 'completed',
      accessCard,
      createdAt: new Date()
    });

    console.log(`✅ Activated ${email} | Access: ${accessCard}`);

    res.status(200).json({ 
      success: true, 
      accessCard,
      message: 'Subscription activated!'
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: error.message });
  }
}
