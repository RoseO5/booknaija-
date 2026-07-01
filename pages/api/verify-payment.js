import crypto from 'crypto';
import clientPromise from '../../lib/mongodb';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { reference } = req.body;
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, { 
      headers: { 'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } 
    });
    const data = await response.json();
    if (!data.status || data.data.status !== 'success') return res.status(400).json({ error: 'Payment failed' });
    const email = data.data.customer.email;
    const accessCard = `BN-${Date.now()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const client = await clientPromise;
    const db = client.db('booknaija');
    await db.collection('users').updateOne(
      { email }, 
      { 
        $set: { 
          'subscription.active': true, 
          'subscription.accessCard': accessCard, 
          'subscription.expiresAt': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
        }, 
        $setOnInsert: { email, role: 'reader', createdAt: new Date() } 
      }, 
      { upsert: true }
    );
    res.status(200).json({ success: true, accessCard });
  } catch (error) { res.status(500).json({ error: error.message }); }
}
