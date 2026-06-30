import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Generate unique reference
    const reference = `BN-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

    // Initialize transaction with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: 100000, // ₦1000 in kobo
        currency: 'NGN',
        reference,
        metadata: {
          custom_fields: [
            { display_name: 'App', variable_name: 'app', value: 'BookNaija' },
            { display_name: 'Plan', variable_name: 'plan', value: 'Premium Reader' }
          ]
        },
        // Redirect here after payment (with reference in URL)
        callback_url: `https://booknaija.vercel.app/payment-success?reference=${reference}`
      })
    });

    const data = await response.json();
    
    if (!data.status) {
      return res.status(400).json({ error: data.message || 'Payment init failed' });
    }

    res.status(200).json({ 
      success: true, 
      checkoutUrl: data.data.authorization_url,
      reference 
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: error.message });
  }
}
