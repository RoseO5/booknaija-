import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { userId, email } = req.body;
    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email required' });
    }

    const amountInKobo = 5000; // ₦50
    const reference = `COIN_${userId}_${Date.now()}`;

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        amount: amountInKobo,
        reference: reference,
        metadata: {
          userId: userId,
          action: 'buy_coins',
          coinAmount: 100
        }
      })
    });

    const data = await response.json();

    if (data.status) {
      res.status(200).json({ success: true, checkoutUrl: data.data.authorization_url, reference });
    } else {
      res.status(500).json({ error: data.message || 'Failed to initialize payment' });
    }
  } catch (error) {
    console.error('Buy coins error:', error);
    res.status(500).json({ error: error.message });
  }
}
