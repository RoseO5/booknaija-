import clientPromise from '../../lib/mongodb';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const client = await clientPromise;
    const db = client.db('booknaija');
    const user = await db.collection('users').findOne({ email });

    // If no pending payment, do nothing
    if (!user?.subscription?.pendingReference) {
      return res.status(200).json({ success: true, hasPending: false });
    }

    const reference = user.subscription.pendingReference;
    
    // Ask Paystack if this reference was paid
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { 'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const data = await response.json();

    if (data.status && data.data.status === 'success') {
      // THEY PAID! Activate premium immediately.
      const accessCard = `BN-${Date.now()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      await db.collection('users').updateOne(
        { email },
        { 
          $set: { 
            'subscription.active': true, 
            'subscription.accessCard': accessCard, 
            'subscription.expiresAt': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
          },
          $unset: { 'subscription.pendingReference': "" } // Clear the pending reference
        }
      );
      return res.status(200).json({ success: true, activated: true, accessCard });
    } else {
      // Still pending or failed
      return res.status(200).json({ success: true, activated: false });
    }
  } catch (error) { 
    console.error('Check pending error:', error);
    res.status(500).json({ error: error.message }); 
  }
}
