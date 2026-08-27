import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  // 1. Check if key exists
  if (!secretKey) {
    return res.status(200).json({
      success: false,
      issue: '❌ PAYSTACK_SECRET_KEY is MISSING in Vercel Environment Variables!',
      fix: 'Go to Vercel → Settings → Environment Variables → Add PAYSTACK_SECRET_KEY with your sk_live_... key, then Redeploy.'
    });
  }

  // 2. Check key format
  const isLiveKey = secretKey.startsWith('sk_live_');
  const isTestKey = secretKey.startsWith('sk_test_');

  if (!isLiveKey && !isTestKey) {
    return res.status(200).json({
      success: false,
      issue: '❌ PAYSTACK_SECRET_KEY has wrong format',
      yourKeyStarts: secretKey.substring(0, 15) + '...',
      fix: 'Key should start with sk_live_ or sk_test_'
    });
  }

  // 3. Test actual connection to Paystack (fetch transactions list - safe, read-only)
  try {
    const response = await fetch('https://api.paystack.co/transaction?perPage=1', {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.status === true) {
      return res.status(200).json({
        success: true,
        message: '✅ Paystack connection is WORKING perfectly!',
        keyType: isLiveKey ? 'LIVE (real money)' : 'TEST (test mode)',
        keyStarts: secretKey.substring(0, 15) + '...',
        fix: 'Your key is valid. If verification still fails, the issue is likely the reference format.'
      });
    } else {
      return res.status(200).json({
        success: false,
        issue: '❌ Paystack rejected your key',
        paystackSays: data.message,
        fix: 'Check your Paystack Dashboard → Settings → API Keys. Make sure you copied the correct key.'
      });
    }
  } catch (error) {
    return res.status(200).json({
      success: false,
      issue: '❌ Network error connecting to Paystack',
      error: error.message
    });
  }
}
