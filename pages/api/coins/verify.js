import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { reference, userId } = req.body;
    if (!reference || !userId) {
      return res.status(400).json({ error: 'reference and userId required' });
    }

    // 1. Verify with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.status && data.data.status === 'success') {
      const client = await clientPromise;
      const db = client.db('booknaija');
      const coinAmount = 100;
      const now = new Date();

      // 2. Credit the user's account
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        {
          $inc: { coins: coinAmount },
          $push: {
            coinTransactions: {
              type: 'earn',
              amount: coinAmount,
              reason: 'Purchased coins via Paystack',
              date: now
            }
          }
        }
      );

      // 3. Get updated balance
      const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });

      res.status(200).json({ 
        success: true, 
        message: 'Payment successful! 100 coins added.',
        newBalance: updatedUser.coins 
      });
    } else {
      res.status(400).json({ error: 'Payment not successful or invalid reference' });
    }
  } catch (error) {
    console.error('Verify coins error:', error);
    res.status(500).json({ error: error.message });
  }
}
