'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import PremiumGate from '../../components/PremiumGate';

export default function BookDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();

  const [book, setBook] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);
  const [markedRead, setMarkedRead] = useState(false);
  const [readResult, setReadResult] = useState<any>(null);
  const [isLoadingLink, setIsLoadingLink] = useState(false); // ✅ New state for button loading
  const timerRef = useRef<any>(null);

  // ✅ Fetch the specific book directly from the dedicated API
  useEffect(() => {
    if (!id) return;

    fetch(`/api/books/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setBook({ error: data.error });
        } else {
          setBook(data);
        }
      })
      .catch(() => setBook({ error: 'Failed to load book' }));
  }, [id]);

  // ✅ NEW: Handle secure book access via presigned URL
  const handleReadBook = async () => {
    if (!session?.user?.email || !book?._id) return;
    
    setIsLoadingLink(true);
    try {
      const res = await fetch(`/api/books/access?bookId=${book._id}&userEmail=${encodeURIComponent(session.user.email)}`);
      const data = await res.json();
      
      if (data.url) {
        window.open(data.url, '_blank'); // Opens the secure, temporary link
      } else {
        alert('❌ ' + (data.error || 'Failed to access book. Please ensure your subscription is active.'));
      }
    } catch (err) {
      alert('❌ Network error while fetching book link.');
    } finally {
      setIsLoadingLink(false);
    }
  };

  // Start timer when user is reading (has active subscription)
  useEffect(() => {
    if (!session?.user?.subscription?.active) return;
    if (!book || (book as any).error) return;

    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.user?.subscription?.active, book]);

  const handleMarkAsRead = async () => {
    if (!session?.user?.id || !book?._id) return;
    try {
      const res = await fetch('/api/books/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          bookId: book._id,
          timeSpent: elapsed
        })
      });
      const data = await res.json();
      setReadResult(data);
      setMarkedRead(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err) {
      alert('Failed to mark as read');
    }
  };

  // ✅ Loading State
  if (!book) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontSize: '18px', color: '#666' }}>
        Loading book...
      </div>
    );
  }

  // ✅ Error State (Book Not Found)
  if ((book as any).error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#dc3545' }}>❌ {(book as any).error}</h2>
        <button onClick={() => router.push('/books')} style={{ marginTop: '20px', padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Back to Books
        </button>
      </div>
    );
  }

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const showMarkButton = elapsed >= 300 && !markedRead; // 5 minutes = 300 seconds

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial' }}>
      <button
        onClick={() => router.push('/books')}
        style={{ marginBottom: '20px', padding: '8px 16px', background: '#f1f1f1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}
      >
        ← Back to Books
      </button>

      <img
        src={book.coverUrl || 'https://via.placeholder.com/400x600/667eea/ffffff?text=' + encodeURIComponent(book.title)}
        alt={book.title}
        style={{ width: '100%', maxWidth: '300px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      />

      <h1 style={{ color: '#333', marginBottom: '10px', fontSize: '24px' }}>{book.title}</h1>
      <p style={{ color: '#666', marginBottom: '25px', fontSize: '16px' }}>By <strong>{book.authorName}</strong></p>

      <PremiumGate>
        {/* Reading Timer - Only visible to premium users */}
        {session?.user?.subscription?.active && (
          <div style={{ background: '#e7f3ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '15px', border: '1px solid #b8daff' }}>
            ⏱️ Reading time: <strong>{minutes}m {seconds}s</strong>
            {!markedRead && elapsed < 300 && (
              <span style={{ color: '#666', marginLeft: '10px', fontSize: '13px' }}>
                (Read for 5 minutes to mark as complete)
              </span>
            )}
          </div>
        )}

        {/* ✅ UPDATED: Secure Read Book Button */}
        <button
          onClick={handleReadBook}
          disabled={isLoadingLink}
          style={{ display: 'inline-block', padding: '15px 30px', background: isLoadingLink ? '#999' : '#667eea', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginRight: '10px', fontSize: '16px', cursor: isLoadingLink ? 'not-allowed' : 'pointer' }}
        >
          {isLoadingLink ? '⏳ Generating Secure Link...' : '📖 Read Book Now'}
        </button>

        {/* Mark as Read Button - Only after 5 minutes */}
        {showMarkButton && (
          <button
            onClick={handleMarkAsRead}
            style={{ padding: '15px 30px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
          >
            ✅ Mark as Read
          </button>
        )}

        {/* Success Message */}
        {markedRead && readResult && (
          <div style={{ background: '#d4edda', padding: '20px', borderRadius: '8px', marginTop: '20px', color: '#155724', border: '1px solid #c3e6cb' }}>
            <strong style={{ fontSize: '18px' }}>✅ Book marked as read!</strong><br/>
            <p style={{ margin: '10px 0 0', fontSize: '15px' }}>
              📚 Competition progress: <strong>{readResult.progressToPrize || 'Updated'}</strong>
            </p>
            <span style={{ fontSize: '14px', display: 'block', marginTop: '10px' }}>
              {readResult.totalBooksRead >= 50
                ? '🎉 Congratulations! You qualify for the ₦5,000 reader prize!'
                : `Read ${50 - (readResult.totalBooksRead || 0)} more unique books in 6 months to qualify.`}
            </span>
          </div>
        )}
      </PremiumGate>
    </div>
  );
}
