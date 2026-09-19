'use client';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

// ✅ NEW: Accept optional bookId and bookTitle for coin unlocks
export default function PremiumGate({ children, bookId, bookTitle }: { children: React.ReactNode, bookId?: string, bookTitle?: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingPending, setCheckingPending] = useState(false);
  
  // ✅ NEW: Coin unlock states
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);

  // ✅ NEW: Check for existing valid unlock on load
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && bookId && !session?.user?.subscription?.active) {
      fetch(`/api/coins/check-unlock?userId=${session.user.id}&bookId=${bookId}`)
        .then(r => r.json())
        .then(data => {
          if (data.isValid) {
            setIsUnlocked(true);
            setCurrentBalance(data.balance);
          }
        })
        .catch(() => {});
    }
  }, [status, session, bookId]);

  // AUTO-CHECK: If user is logged in but not premium, check if they paid while away
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && !session?.user?.subscription?.active && !isUnlocked) {
      setCheckingPending(true);
      fetch('/api/check-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email })
      })
      .then(r => r.json())
      .then(data => {
        if (data.activated) {
          window.location.reload();
        }
      })
      .catch(() => {})
      .finally(() => setCheckingPending(false));
    }
  }, [status, session, isUnlocked]);
  // ✅ NEW: Auto-verify Paystack coin purchase on redirect
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && router.isReady) {
      const { reference } = router.query;
      if (reference && typeof reference === 'string' && reference.startsWith('COIN_')) {
        setUnlocking(true);
        fetch('/api/coins/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference, userId: session.user.id })
        })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setCurrentBalance(data.newBalance);
            alert(`✅ Success! ${data.message}\nYour new balance is ${data.newBalance} coins.`);
            // Clean the URL so it doesn't verify again on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            alert('Payment verification failed: ' + data.error);
          }
        })
        .catch(() => alert('Network error during verification'))
        .finally(() => setUnlocking(false));
      }
    }
  }, [status, session, router.isReady, router.query]);


  if (status === 'loading' || checkingPending) return <div style={{textAlign:'center',padding:'30px'}}>Loading...</div>;

  if (status === 'unauthenticated') {
    return (
      <div style={{textAlign:'center',padding:'30px',background:'#f8f9fa',borderRadius:'12px'}}>
        <h3 style={{color:'#667eea'}}>🔐 Premium Content</h3>
        <p style={{color:'#666',marginBottom:'20px'}}>Sign in to read • ₦1000/month</p>
        <button onClick={() => signIn('google')} style={{padding:'12px 30px',background:'#4285f4',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'bold'}}>
          🔐 Sign in with Google
        </button>
      </div>
    );
  }

  const hasActiveSubscription = session?.user?.subscription?.active;
  const expiresAt = session?.user?.subscription?.expiresAt ? new Date(session.user.subscription.expiresAt) : null;
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const handleSubscribe = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email })
      });
      const data = await res.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      else alert('Error: ' + data.error);
    } catch (err) { alert('Network error'); } finally { setLoading(false); }
  };

  // ✅ NEW: Handle Coin Unlock
  const handleUnlockWithCoins = async () => {
    if (!session?.user?.id || !bookId) return;
    setUnlocking(true);
    setUnlockError('');
    try {
      const res = await fetch('/api/coins/unlock-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: session.user.id, 
          bookId, 
          bookTitle: bookTitle || 'Unknown Book' 
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsUnlocked(true);
        setCurrentBalance(data.newBalance);
        alert(`✅ Success! ${data.message}\nYou now have ${data.newBalance} coins remaining.`);
      } else {
        setUnlockError(data.error || 'Failed to unlock');
        if (data.currentBalance !== undefined) {
          setCurrentBalance(data.currentBalance);
        }
      }
    } catch (err) { 
      setUnlockError('Network error. Please try again.'); 
    } finally { 
      setUnlocking(false); 
    }
  };

  // ✅ NEW: If unlocked via coins, render children
  if (isUnlocked) {
    return (
      <>
        <div style={{background:'#e7f3ff',padding:'10px',borderRadius:'8px',marginBottom:'15px',fontSize:'13px',color:'#004085', border:'1px solid #b8daff'}}>
          ✅ Book Unlocked for 24 Hours! • Remaining Coins: <strong>{currentBalance ?? '...'}</strong>
        </div>
        {children}
      </>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div style={{textAlign:'center',padding:'30px',background:'#fff3cd',borderRadius:'12px',border:'1px solid #ffc107'}}>
        <h3 style={{color:'#856404'}}>⭐ Premium Access</h3>
        <p style={{color:'#856404',marginBottom:'20px'}}>Unlock unlimited reading for <strong>₦1000/month</strong></p>
        <ul style={{textAlign:'left',color:'#856404',marginBottom:'20px',paddingLeft:'20px'}}>
          <li>✅ Read all published books</li>
          <li>✅ Support Nigerian authors</li>
          <li>✅ Instant access after payment</li>
        </ul>
        
        <button onClick={handleSubscribe} disabled={loading} style={{padding:'12px 30px',background:loading?'#999':'#28a745',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'bold', marginBottom: '15px'}}>
          {loading ? '⏳ Processing...' : ' 💳 Pay ₦1000 with Paystack'}
        </button>

        {/* ✅ NEW: Coin Unlock Option */}
        {bookId && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed #ffc107' }}>
            <p style={{color:'#856404', fontSize:'14px', marginBottom:'10px'}}>
              Or unlock <strong>this specific book</strong> for 24 hours!
            </p>
            <button 
              onClick={handleUnlockWithCoins} 
              disabled={unlocking} 
              style={{padding:'10px 20px',background:unlocking?'#999':'#667eea',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'bold'}}
            >
              {unlocking ? '⏳ Unlocking...' : '🔓 Unlock for 100 Coins'}
            </button>
            {currentBalance !== null && (
              <p style={{fontSize:'12px',color:'#666',marginTop:'8px'}}>Your balance: {currentBalance} coins</p>
            )}
            {unlockError && (
              <p style={{fontSize:'12px',color:'#dc3545',marginTop:'8px', fontWeight:'bold'}}>{unlockError}</p>
            )}
            
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #667eea' }}>
              <p style={{fontSize:'13px',color:'#333', fontWeight:'bold', marginBottom:'8px'}}>Need more coins?</p>
              <button 
                onClick={async () => {
                  if (!session?.user?.id || !session?.user?.email) return;
                  setUnlocking(true);
                  try {
                    const res = await fetch('/api/coins/buy', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: session.user.id, email: session.user.email })
                    });
                    const data = await res.json();
                    if (data.checkoutUrl) {
                      window.location.href = data.checkoutUrl;
                    } else {
                      alert('Error: ' + data.error);
                      setUnlocking(false);
                    }
                  } catch (err) {
                    alert('Network error');
                    setUnlocking(false);
                  }
                }}
                disabled={unlocking}
                style={{padding:'10px 20px',background:unlocking?'#999':'#28a745',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'bold', width: '100%'}}
              >
                {unlocking ? '⏳ Loading...' : '💳 Buy 100 Coins for ₦100'}
              </button>
            </div>
            <p style={{fontSize:'11px',color:'#999',marginTop:'10px'}}>💡 Don't have coins? Read more books to earn them, or buy instantly!</p>
          </div>
        )}

        <p style={{fontSize:'12px',color:'#666',marginTop:'15px'}}>🔒 Secure payment • Card, Bank Transfer, USSD accepted</p>
        <p style={{fontSize:'11px',color:'#999',marginTop:'10px'}}>💡 If you already paid via transfer, just refresh this page!</p>
      </div>
    );
  }

  return (
    <>
      <div style={{background:'#d4edda',padding:'10px',borderRadius:'8px',marginBottom:'15px',fontSize:'13px',color:'#155724'}}>
        ✅ Premium Active • Access: <strong>{session?.user?.subscription?.accessCard}</strong>
        {daysLeft > 0 && daysLeft <= 7 && (
          <span style={{marginLeft:'10px',color:'#856404'}}>
            ⚠️ Expires in {daysLeft} day{daysLeft > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {children}
    </>
  );
}
