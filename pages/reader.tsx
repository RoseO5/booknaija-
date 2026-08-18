'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function PDFReader() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [secondsRead, setSecondsRead] = useState(0);
  const heartbeatRef = useRef<any>(null);

  useEffect(() => {
    if (!id || !session?.user?.email) return;

    // 1. Fetch the secure inline URL
    fetch(`/api/books/access?bookId=${id}&userEmail=${encodeURIComponent(session.user.email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.url) {
          setPdfUrl(data.url);
        } else {
          setError(data.error || 'Failed to load book');
        }
        setIsLoading(false);
      })
      .catch(err => {
        setError('Network error: ' + err.message);
        setIsLoading(false);
      });

    // 2. ANTI-CHEAT: Disable right-click on the entire reader page
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // 3. HEARTBEAT TRACKING: Ping server every 30 seconds to log real reading time
    heartbeatRef.current = setInterval(() => {
      setSecondsRead(prev => {
        const newTime = prev + 30;
        
        // Securely log this 30 seconds to the database for the prize draw
        fetch('/api/books/track-reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            bookId: id, 
            userId: session?.user?.id,
            timeSpent: 30 
          })
        }).catch(err => console.error('Tracking error:', err));

        return newTime;
      });
    }, 30000); // 30 seconds

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [id, session?.user?.email, session?.user?.id]);

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial', background: '#f5f5f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📖</div>
          <h2 style={{ color: '#667eea' }}>Loading your book securely...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial', background: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: '#dc3545' }}>{error}</h2>
          <button onClick={() => router.push('/books')} style={{ marginTop: '20px', padding: '12px 30px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            ← Back to Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', background: '#333' }}>
      {/* Header Bar */}
      <div style={{ padding: '10px 20px', background: '#667eea', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <button onClick={() => router.push('/books')} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Exit Reader
        </button>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>📖 BookNaija Reader</h3>
          <span style={{ fontSize: '12px', opacity: 0.9 }}>⏱️ Time Read: {Math.floor(secondsRead / 60)}m {secondsRead % 60}s</span>
        </div>
        <div style={{ width: '100px' }}></div>
      </div>

      {/* ANTI-CHEAT WATERMARK: Subtly overlays the user's email to discourage screenshots/sharing */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-30deg)',
        fontSize: '24px',
        color: 'rgba(255, 255, 255, 0.15)',
        pointerEvents: 'none',
        zIndex: 10,
        whiteSpace: 'nowrap',
        fontWeight: 'bold',
        textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
      }}>
        BookNaija • {session?.user?.email} • Do Not Share
      </div>

      {/* PDF Viewer - Full Screen. The 'fl_inline' flag from the API forces it to render here, not download. */}
      <iframe
        src={pdfUrl}
        style={{ flex: 1, width: '100%', border: 'none', background: '#525659' }}
        title="PDF Reader"
      />
    </div>
  );
}
