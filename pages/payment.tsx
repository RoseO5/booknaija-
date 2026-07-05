'use client';
import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Payment() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  if (status === 'loading') {
    return <div style={{padding:'40px',textAlign:'center'}}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '50px auto', fontFamily: 'Arial', textAlign: 'center' }}>
      <h1 style={{ color: '#667eea' }}>💳 Premium Subscription</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Unlock unlimited reading for <strong>₦1000/month</strong>.
      </p>

      {error && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
        <h3>What you get:</h3>
        <ul style={{ textAlign: 'left', color: '#666', lineHeight: '1.8' }}>
          <li>✅ Read all published books</li>
          <li>✅ Support Nigerian authors</li>
          <li>✅ Compete for the ₦5,000 reader prize</li>
          <li>✅ Instant access after payment</li>
        </ul>
      </div>

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

      <p style={{ fontSize: '12px', color: '#999', marginTop: '20px' }}>
        🔒 Secure payment via Paystack • Card, Bank Transfer, USSD accepted
      </p>
    </div>
  );
}
