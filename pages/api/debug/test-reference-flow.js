import clientPromise from '../../../lib/mongodb';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY missing' });
  }

  try {
    // 1. Generate reference (same format as create-payment.js)
    const reference = `BN-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    
    console.log('📝 Generated reference:', reference);

    // 2. Save to database (same as create-payment.js)
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      { $set: { 'subscription.pendingReference': reference } },
      { upsert: true }
    );

    // 3. Retrieve from database (same as verify-stored-payment.js)
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    const retrievedReference = user.subscription.pendingReference;
    
    console.log('📦 Retrieved from DB:', retrievedReference);
    console.log('✅ Match?', reference === retrievedReference);

    // 4. Try to initialize with Paystack (this creates the transaction but doesn't charge)
    const initResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        amount: 100000, // ₦1000 in kobo
        reference: reference
      })
    });

    const initData = await initResponse.json();
    console.log('📤 Paystack init response:', initData);

    if (!initData.status) {
      return res.status(200).json({
        success: false,
        issue: '❌ Paystack rejected the reference during initialization',
        paystackSays: initData.message,
        generatedReference: reference,
        fix: 'The reference format might be invalid for Paystack'
      });
    }

    // 5. Immediately try to verify (will fail because no payment, but we want to see the error)
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const verifyData = await verifyResponse.json();
    console.log('🔍 Paystack verify response:', verifyData);

    // 6. Clean up - remove the test reference
    await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      { $unset: { 'subscription.pendingReference': '' } }
    );

    // 7. Return diagnostic results
    return res.status(200).json({
      success: true,
      message: '✅ Reference flow test complete!',
      diagnostics: {
        generatedReference: reference,
        retrievedFromDB: retrievedReference,
        databaseMatch: reference === retrievedReference,
        paystackInitialization: initData.status ? '✅ SUCCESS' : '❌ FAILED',
        paystackInitMessage: initData.message || 'No message',
        paystackVerification: verifyData.status ? '✅ SUCCESS (unexpected!)' : '❌ FAILED (expected - no payment made)',
        paystackVerifyMessage: verifyData.message || 'No message',
        checkoutUrl: initData.data?.authorization_url || null
      },
      conclusion: verifyData.message?.includes('not found') 
        ? '❌ Paystack says reference not found even though we just created it. This is the bug!'
        : verifyData.message?.includes('pending')
        ? '✅ Reference is valid! It just says "pending" because no payment was made. This is GOOD - it means the flow works!'
        : '⚠️ Unexpected response. Check the diagnostics above.'
    });

  } catch (error) {
    console.error('💥 Test error:', error);
    return res.status(500).json({ error: error.message });
  }
}
