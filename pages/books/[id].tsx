'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import PremiumGate from '../../components/PremiumGate';

export default function BookDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();

  const [book, setBook] = useState<any>(null);
  const [markedRead, setMarkedRead] = useState(false);
  const [readResult, setReadResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTipping, setIsTipping] = useState(false);

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
          // We NO LONGER send timeSpent. The server checks the real tracked time!
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setReadResult(data);
        setMarkedRead(true);
      } else {
        // Show the friendly server message if they haven't read enough
        alert('⏳ ' + (data.error || 'Failed to mark as read'));
      }
    } catch (err: any) { 
      alert('❌ Network Error: ' + err.message); 
    } finally {
      setIsProcessing(false);
    }
  };

  if (!book) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading book...</div>;
  if ((book as any).error) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2 style={{ color: '#dc3545' }}>❌ {(book as any).error}</h2>
      <button onClick={() => router.push('/books')} style={{ marginTop: '20px', padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>
    </div>
  );


  const handleTipAuthor = async () => {
    if (!session?.user?.id || !book?.authorEmail) return;
    if (!confirm(`🎁 Tip the author 50 coins for "${book.title}"?

This shows your appreciation and supports Nigerian writers!`)) return;
    
    setIsTipping(true);
    try {
      const res = await fetch('/api/coins/tip-author', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          authorEmail: book.authorEmail,
          bookId: book._id,
          bookTitle: book.title
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
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

        {/* 🎁 TIP AUTHOR BUTTON */}
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px dashed #ddd', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            Loved this book? Support the author directly!
          </p>
          <button 
            onClick={handleTipAuthor}
            disabled={isTipping}
            style={{ 
              padding: '12px 24px', 
              background: isTipping ? '#999' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '16px', 
              cursor: isTipping ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(245, 87, 108, 0.3)'
            }}
          >
            {isTipping ? '⏳ Processing...' : '🎁 Tip Author 50 Coins'}
          </button>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            💡 50 coins = ₦5 directly to the author's earnings.
          </p>
        </div>
      </PremiumGate>
    </div>
  );
}
