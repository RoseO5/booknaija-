'use client';

import { useSession, signIn } from 'next-auth/react';

export default function PremiumGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div style={{ textAlign: 'center', padding: '30px' }}>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{ textAlign: 'center', padding: '30px', background: '#f8f9fa', borderRadius: '12px' }}>
        <h3 style={{ color: '#667eea' }}>🔐 Premium Content</h3>
        <p style={{ color: '#666', marginBottom: '20px' }}>Sign in to read this book • ₦1000/month</p>
        <button onClick={() => signIn('google')} style={{ padding: '12px 30px', background: '#4285f4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          🔐 Sign in with Google
        </button>
      </div>
    );
  }

  // Logged in but not premium -> show subscribe prompt
  return (
    <div style={{ textAlign: 'center', padding: '30px', background: '#fff3cd', borderRadius: '12px', border: '1px solid #ffc107' }}>
      <h3 style={{ color: '#856404' }}>⭐ Premium Access Required</h3>
      <p style={{ color: '#856404', marginBottom: '20px' }}>Unlock unlimited reading for just <strong>₦1000/month</strong></p>
      <ul style={{ textAlign: 'left', color: '#856404', marginBottom: '20px', paddingLeft: '20px' }}>
        <li>✅ Read all published books</li>
        <li>✅ Support Nigerian authors</li>
        <li>✅ Cancel anytime</li>
      </ul>
      
      <a 
        href={process.env.NEXT_PUBLIC_SELAR_LINK || 'https://selar.co/m/your-link'} 
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-block', padding: '12px 30px', background: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}
      >
        💳 Subscribe via Selar (₦1000)
      </a>
      
      <p style={{ fontSize: '12px', color: '#666', marginTop: '15px' }}>
        🔒 Secure payment • After payment, email receipt to <strong>hello@booknaija.com</strong> to activate
      </p>
    </div>
  );
}
