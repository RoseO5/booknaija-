'use client';
import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function Payment() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') signIn('google');
  }, [status]);

  const handlePayment = async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email })
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || 'Failed to start payment');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  // ✅ NEW: "I Have Paid" button - auto-verifies using stored reference
  const handleIPaid = async () => {
    if (!session?.user?.email) return;
    setChecking(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/verify-stored-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email })
      });
      const data = await res.json();
      
      if (data.success) {
        setResult({
          success: true,
          accessCard: data.accessCard,
          expiresAt: data.expiresAt
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Payment not confirmed yet. Bank transfers can take 1-5 minutes. Please wait and click "I Have Paid" again.'
        });
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  if (status === 'loading') return <div style={{padding:'40px',textAlign:'center'}}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '50px auto', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#667eea', textAlign: 'center' }}>💳 Premium Subscription</h1>
      <p style={{ color: '#666', textAlign: 'center', marginBottom: '30px' }}>
        Unlock unlimited reading for <strong>₦1000 / 6 months</strong>.
      </p>

      {error && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
          ❌ {error}
        </div>
      )}

      {/* ✅ SUCCESS STATE */}
      {result?.success && (
        <div style={{ background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)', padding: '25px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', border: '2px solid #28a745' }}>
          <div style={{fontSize:'50px',marginBottom:'10px'}}>🎉</div>
          <h2 style={{ color: '#155724', marginTop: 0 }}>Payment Confirmed!</h2>
          <p style={{ color: '#155724', marginBottom: '15px' }}>Your premium access is now active.</p>
          
          <div style={{ background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Your Access Card</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#667eea', letterSpacing: '2px' }}>
              {result.accessCard}
            </div>
          </div>

          <a 
            href="https://chat.whatsapp.com/IDewvgS4R724cJ0YkTt69O?mode=gi_t" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ display: 'block', padding: '15px', background: '#25D366', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}
          >
            💬 Join Readers WhatsApp Group
          </a>

          <a href="/books" style={{ display: 'block', padding: '15px', background: '#667eea', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px' }}>
            📚 Start Reading Now
          </a>
        </div>
      )}

      {/* ✅ WAITING STATE */}
      {result && !result.success && (
        <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #ffc107', textAlign: 'center' }}>
          <div style={{fontSize:'40px',marginBottom:'10px'}}>⏳</div>
          <h3 style={{ color: '#856404', marginTop: 0 }}>Payment Processing</h3>
          <p style={{ color: '#856404', fontSize: '14px', lineHeight: '1.6' }}>{result.message}</p>
          <button
            onClick={handleIPaid}
            style={{ marginTop: '15px', padding: '12px 30px', background: '#ffc107', color: '#856404', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🔄 Check Again
          </button>
        </div>
      )}

      {/* ✅ MAIN PAYMENT SECTION */}
      {!result?.success && (
        <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #dee2e6' }}>
          <h3 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>Step 1: Make Payment</h3>
          <ul style={{ textAlign: 'left', color: '#666', lineHeight: '1.8', fontSize: '14px', marginBottom: '20px' }}>
            <li>✅ Read all published books</li>
            <li>✅ Support Nigerian authors</li>
            <li>✅ Compete for the ₦5,000 reader prize</li>
            <li>✅ Instant access after payment</li>
          </ul>
          <button
            onClick={handlePayment}
            disabled={loading}
            style={{
              width: '100%', padding: '15px',
              background: loading ? '#999' : '#28a745',
              color: 'white', border: 'none', borderRadius: '8px',
              fontWeight: 'bold', fontSize: '18px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Opening Paystack...' : '💳 Pay ₦1000 with Paystack'}
          </button>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '15px', textAlign: 'center' }}>
            🔒 Card, Bank Transfer, USSD accepted
          </p>
        </div>
      )}

      {/* ✅ "I HAVE PAID" BUTTON */}
      {!result?.success && (
        <div style={{ background: '#e7f3ff', padding: '25px', borderRadius: '12px', border: '1px solid #b8daff', textAlign: 'center' }}>
          <h3 style={{ marginTop: 0, color: '#004085' }}>Step 2: Confirm Payment</h3>
          <p style={{ fontSize: '14px', color: '#004085', marginBottom: '15px' }}>
            After completing payment on Paystack, click the button below. We'll automatically verify and activate your account.
          </p>
          <button
            onClick={handleIPaid}
            disabled={checking}
            style={{
              width: '100%', padding: '15px',
              background: checking ? '#999' : '#007bff',
              color: 'white', border: 'none', borderRadius: '8px',
              fontWeight: 'bold', fontSize: '16px',
              cursor: checking ? 'not-allowed' : 'pointer'
            }}
          >
            {checking ? '⏳ Checking your payment...' : '✅ I Have Paid'}
          </button>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            💡 Bank transfers may take 1-5 minutes to confirm.
          </p>
        </div>
      )}
    </div>
  );
}
