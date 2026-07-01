'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState } from 'react';

export default function PremiumGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  if (status === 'loading') {
    return <div style={{ textAlign: 'center', padding: '30px' }}>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{ textAlign: 'center', padding: '30px', background: '#f8f9fa', borderRadius: '12px' }}>
        <h3 style={{ color: '#667eea' }}>🔐 Premium Content</h3>
        <p style={{ color: '#666', marginBottom: '20px' }}>Sign in to read • ₦1000/month</p>
        <button onClick={() => signIn('google')} style={{ padding: '12px 30px', background: '#4285f4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          🔐 Sign in with Google
        </button>
      </div>
    );
  }

  const hasActiveSubscription = session?.user?.subscription?.active;
  const accessCard = session?.user?.subscription?.accessCard;

  const handleSubscribe = async () => {
    if (!session?.user) return;
    setLoading(true);
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
        window.location.href = data.checkoutUrl;
      } else {
        alert('❌ ' + (data.error || 'Payment failed'));
        setLoading(false);
      }
    } catch (err) {
      alert('❌ Network error');
      setLoading(false);
    }
  };

  if (!hasActiveSubscription) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', background: '#fff3cd', borderRadius: '12px', border: '1px solid #ffc107' }}>
        <h3 style={{ color: '#856404' }}>⭐ Premium Access</h3>
        <p style={{ color: '#856404', marginBottom: '20px' }}>
          Unlock unlimited reading for <strong>₦1000/month</strong>
        </p>
        <ul style={{ textAlign: 'left', color: '#856404', marginBottom: '20px', paddingLeft: '20px' }}>
          <li>✅ Read all published books</li>
          <li>✅ Support Nigerian authors</li>
          <li>✅ Instant access after payment</li>
        </ul>
        
        <button 
          onClick={handleSubscribe}
          disabled={loading}
          style={{ padding: '12px 30px', background: loading ? '#999' : '#0ba51d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? '⏳ Processing...' : '💳 Pay ₦1000 with Paystack'}
        </button>
        
        <p style={{ fontSize: '12px', color: '#666', marginTop: '15px' }}>
          🔒 Secure payment • Card, Bank Transfer, USSD accepted
        </p>
      </div>
    );
  }

  return (
    <>
      <div style={{ background: '#d4edda', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', color: '#155724' }}>
        ✅ Premium Active • Access: <strong>{accessCard}</strong>
      </div>
      {children}
    </>
  );
}
