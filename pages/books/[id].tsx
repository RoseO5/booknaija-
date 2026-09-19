'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import PremiumGate from '../../components/PremiumGate';

export default function BookDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();

  const [book, setBook] = useState<any>(null);
  const [markedRead, setMarkedRead] = useState(false);
  const [readResult, setReadResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [userCoins, setUserCoins] = useState<number | null>(null);

  // Fetch book details
  useEffect(() => {
    if (!id) return;
    fetch(`/api/books/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setBook({ error: data.error });
        else setBook(data);
      })
      .catch(() => setBook({ error: 'Failed to load book' }));
  }, [id]);

  // Fetch user's coin balance
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetch(`/api/coins/balance?userId=${session.user.id}`)
        .then(r => r.json())
        .then(data => setUserCoins(data.balance ?? 0))
        .catch(() => {});
    }
  }, [status, session]);

  const handleReadBook = () => {
    if (!session?.user?.email || !book?._id) {
      alert('❌ Please log in to read this book.');
      return;
    }
    window.open(`/reader?id=${book._id}`, '_blank');
  };

  const handleMarkAsRead = async () => {
    if (!session?.user?.id || !book?._id) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/books/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          bookId: book._id
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setReadResult(data);
        setMarkedRead(true);
        // Refresh coin balance in case reading earned coins
        fetch(`/api/coins/balance?userId=${session.user.id}`)
          .then(r => r.json())
          .then(d => setUserCoins(d.balance ?? 0));
      } else {
        alert('⏳ ' + (data.error || 'Failed to mark as read'));
      }
    } catch (err: any) {
      alert('❌ Network Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTipAuthor = async (amount: number) => {
    if (!session?.user?.id || !book?.authorEmail) return;
    const nairaValue = (amount * 0.10).toFixed(2);
    if (!confirm(`🎁 Tip the author ${amount} coins (₦${nairaValue}) for "${book.title}"?\n\nThis shows your appreciation and supports Nigerian writers!`)) return;
    
    setIsTipping(true);
    try {
      const res = await fetch('/api/coins/tip-author', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          authorEmail: book.authorEmail,
          bookId: book._id,
          bookTitle: book.title,
          tipAmount: amount
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserCoins(data.newBalance);
        alert(`✅ Success! ${data.message}\nYour new coin balance is ${data.newBalance}.`);
      } else {
        alert('❌ ' + (data.error || 'Failed to tip author'));
      }
    } catch (err) {
      alert('❌ Network error. Please try again.');
    } finally {
      setIsTipping(false);
    }
  };

  if (!book) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading book...</div>;
  if ((book as any).error) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2 style={{ color: '#dc3545' }}>❌ {(book as any).error}</h2>
      <button onClick={() => router.push('/books')} style={{ marginTop: '20px', padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial' }}>
      <button onClick={() => router.push('/books')} style={{ marginBottom: '20px', padding: '8px 16px', background: '#f1f1f1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>← Back to Books</button>
      
      <img src={book.coverUrl || 'https://via.placeholder.com/400x600/667eea/ffffff?text=' + encodeURIComponent(book.title)} alt={book.title} style={{ width: '100%', maxWidth: '300px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
      
      <h1 style={{ color: '#333', marginBottom: '10px', fontSize: '24px' }}>{book.title}</h1>
      <p style={{ color: '#666', marginBottom: '25px', fontSize: '16px' }}>By <strong>{book.authorName}</strong></p>

      <PremiumGate bookId={book._id} bookTitle={book.title}>
        <div style={{ background: '#e7f3ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '15px', border: '1px solid #b8daff' }}>
          📖 <strong>How to earn prize points:</strong><br/>
          1. Click "Read Book Now" to open the secure reader.<br/>
          2. Read for at least <strong>15 minutes</strong> (the reader tracks your time securely).<br/>
          3. Return here and click "✅ Mark as Read" to claim your progress!
        </div>

        <button onClick={handleReadBook} style={{ display: 'inline-block', padding: '15px 30px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginRight: '10px', fontSize: '16px', cursor: 'pointer' }}>
          📖 Read Book Now
        </button>

        {!markedRead && (
          <button
            onClick={handleMarkAsRead}
            disabled={isProcessing}
            style={{ padding: '15px 30px', background: isProcessing ? '#999' : '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isProcessing ? 'not-allowed' : 'pointer', fontSize: '16px' }}
          >
            {isProcessing ? '⏳ Verifying...' : '✅ Mark as Read'}
          </button>
        )}

        {markedRead && readResult && (
          <div style={{ background: '#d4edda', padding: '20px', borderRadius: '8px', marginTop: '20px', color: '#155724', border: '1px solid #c3e6cb' }}>
            <strong style={{ fontSize: '18px' }}>✅ Book marked as read!</strong><br/>
            <p style={{ margin: '10px 0 0', fontSize: '15px' }}>📚 Competition progress: <strong>{readResult.progressToPrize}</strong></p>
            <p style={{ margin: '5px 0 0', fontSize: '13px', opacity: 0.8 }}>Verified reading time: {Math.floor(readResult.trackedTime / 60)}m {readResult.trackedTime % 60}s</p>
          </div>
        )}

        {/* 🎁 TIP AUTHOR - FLEXIBLE AMOUNTS */}
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px dashed #ddd' }}>
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <p style={{ fontSize: '16px', color: '#333', fontWeight: 'bold', marginBottom: '5px' }}>
              🎁 Loved this book? Support the author!
            </p>
            {userCoins !== null && (
              <div>
                <p style={{ fontSize: '13px', color: '#667eea', marginBottom: '8px' }}>
                  Your balance: <strong>{userCoins} coins</strong>
                </p>
                {userCoins < 100 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                    <button 
                      onClick={async () => {
                        if (!session?.user?.id || !session?.user?.email) {
                          alert('❌ Please log in to buy coins.');
                          return;
                        }
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
                            alert('❌ Error: ' + (data.error || 'Failed to initialize payment'));
                          }
                        } catch (err) {
                          alert('❌ Network error. Please try again.');
                        }
                      }}
                      style={{ 
                        padding: '10px 16px', 
                        background: '#28a745', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        fontSize: '14px', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(40, 167, 69, 0.3)',
                        width: '100%',
                        maxWidth: '250px'
                      }}
                    >
                      💳 Buy 100 Coins for ₦100
                    </button>
                    <a 
                      href="/trivia"
                      style={{ 
                        display: 'block',
                        width: '100%',
                        maxWidth: '250px',
                        padding: '10px 16px', 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                        color: 'white', 
                        textDecoration: 'none', 
                        borderRadius: '6px', 
                        fontSize: '14px', 
                        fontWeight: 'bold', 
                        textAlign: 'center',
                        boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
                      }}
                    >
                      🏆 Enter Monthly Trivia
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
            {[
              { amount: 25, label: 'Small Tip', naira: '₦2.50' },
              { amount: 50, label: 'Medium Tip', naira: '₦5.00' },
              { amount: 100, label: 'Big Tip', naira: '₦10.00' }
            ].map((tip) => (
              <button
                key={tip.amount}
                onClick={() => handleTipAuthor(tip.amount)}
                disabled={isTipping || (userCoins !== null && userCoins < tip.amount)}
                style={{
                  padding: '12px 8px',
                  background: isTipping || (userCoins !== null && userCoins < tip.amount) 
                    ? '#ccc' 
                    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: isTipping || (userCoins !== null && userCoins < tip.amount) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(245, 87, 108, 0.2)'
                }}
              >
                <div style={{ fontSize: '16px' }}>🪙 {tip.amount}</div>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>{tip.label}</div>
                <div style={{ fontSize: '10px', opacity: 0.9 }}>{tip.naira}</div>
              </button>
            ))}
          </div>
          
          <p style={{ fontSize: '11px', color: '#999', textAlign: 'center' }}>
            💡 Tip goes directly to the author's earnings.
          </p>
        </div>
      </PremiumGate>
    </div>
  );
}
