import crypto from 'crypto';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const reference = `BN-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        amount: 100000, 
        currency: 'NGN', 
        reference, 
        callback_url: `https://booknaija.vercel.app/payment-success?reference=${reference}` 
      })
    });
    const data = await response.json();
    if (!data.status) return res.status(400).json({ error: data.message });
    res.status(200).json({ success: true, checkoutUrl: data.data.authorization_url, reference });
  } catch (error) { res.status(500).json({ error: error.message }); }
}
