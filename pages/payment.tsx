'use client';
import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function Payment() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ref, setRef] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('google');
    }
  }, [status]);

  const handlePayment = async () => {
    if (!session?.user?.email) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          name: session.user.name
        })
      });

      const data = await res.json();

      if (data.checkoutUrl) {
        // Redirect to Paystack
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || 'Failed to initialize payment');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      setLoading(false);
    }
  };

  const handleVerifyTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ref.trim()) return;
    
    setVerifyLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/users/verify-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session?.user?.email,
          name: session?.user?.name,
          reference: ref.trim()
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess(data.message);
        setRef('');
        // Auto-redirect to books after 2 seconds
        setTimeout(() => {
          window.location.href = '/books';
        }, 2000);
      } else {
        setError(data.error || 'Failed to verify');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  if (status === 'loading') {
    return <div style={{padding:'40px',textAlign:'center'}}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '50px auto', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#667eea', textAlign: 'center' }}>💳 Premium Subscription</h1>
      <p style={{ color: '#666', textAlign: 'center', marginBottom: '30px' }}>
        Unlock unlimited reading for <strong>₦1000 / month</strong>.
      </p>

      {error && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{ background: '#d4edda', color: '#155724', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
          ✅ {success}
        </div>
      )}

      {/* OPTION 1: PAYSTACK CHECKOUT */}
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #dee2e6' }}>
        <h3 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>Option 1: Pay Now</h3>
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
            width: '100%',
            padding: '15px',
            background: loading ? '#999' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '18px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Processing...' : 'Pay ₦1000 with Paystack'}
        </button>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '15px', textAlign: 'center' }}>
          🔒 Secure payment via Paystack • Card, Bank Transfer, USSD accepted
        </p>
      </div>

      <div style={{ textAlign: 'center', margin: '20px 0', color: '#999', fontWeight: 'bold' }}>— OR —</div>

      {/* OPTION 2: VERIFY EXISTING PAYSTACK PAYMENT */}
      <div style={{ background: '#e7f3ff', padding: '20px', borderRadius: '12px', border: '1px solid #b8daff' }}>
        <h3 style={{ marginTop: 0, color: '#004085', textAlign: 'center' }}>Option 2: Already Paid via Paystack?</h3>
        <p style={{ fontSize: '14px', color: '#004085', marginBottom: '15px', textAlign: 'center' }}>
          If you used <strong>Bank Transfer or USSD</strong> inside the Paystack portal, enter your Paystack Transaction Reference below to activate your account instantly.
        </p>
        
        <form onSubmit={handleVerifyTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Paystack Transaction Reference *</label>
            <input 
              name="reference" 
              type="text" 
              required 
              placeholder="e.g., T234567890 (from Paystack receipt)" 
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '2px solid #007bff', borderRadius: '6px', boxSizing: 'border-box', fontSize: '16px' }} 
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              💡 You can find this reference in your Paystack payment receipt or bank SMS.
            </p>
          </div>

          <button type="submit" disabled={verifyLoading}
            style={{
              width: '100%', padding: '14px', background: verifyLoading ? '#999' : '#007bff',
              color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: verifyLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {verifyLoading ? '⏳ Verifying with Paystack...' : '✅ Activate My Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
