'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function PaymentSuccess() {
  const router = useRouter();
  const { reference } = router.query;
  const [status, setStatus] = useState('verifying');
  const [accessCard, setAccessCard] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) return;

    const verifyPayment = async () => {
      try {
        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference })
        });
        const data = await res.json();

        if (data.success) {
          setAccessCard(data.accessCard);
          setStatus('success');
          // Redirect to books after 3 seconds
          setTimeout(() => router.push('/books'), 3000);
        } else {
          setError(data.error || 'Verification failed');
          setStatus('error');
        }
      } catch (err: any) {
        setError(err.message || 'Network error');
        setStatus('error');
      }
    };

    verifyPayment();
  }, [reference, router]);

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial', maxWidth: '500px', margin: '50px auto' }}>
      {status === 'verifying' && (
        <>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>⏳</div>
          <h1 style={{ color: '#667eea' }}>Verifying Payment...</h1>
          <p style={{ color: '#666' }}>Please wait while we confirm your payment</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
          <h1 style={{ color: '#28a745' }}>Payment Successful!</h1>
          <p style={{ color: '#666', fontSize: '18px', marginTop: '15px' }}>
            Your premium access is now active
          </p>
          <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', margin: '20px 0', color: '#155724' }}>
            <strong>Your Access Card:</strong><br/>
            <span style={{ fontSize: '18px', fontFamily: 'monospace' }}>{accessCard}</span>
          </div>
          <p style={{ color: '#999' }}>Redirecting to your library...</p>
          <a href="/books" style={{ color: '#667eea', fontWeight: 'bold', textDecoration: 'none' }}>
            Go to Library Now →
          </a>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>❌</div>
          <h1 style={{ color: '#dc3545' }}>Verification Failed</h1>
          <p style={{ color: '#666' }}>{error}</p>
          <a href="/books" style={{ color: '#667eea', fontWeight: 'bold', textDecoration: 'none' }}>
            ← Back to Library
          </a>
        </>
      )}
    </div>
  );
}
