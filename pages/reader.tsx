'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function PDFReader() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || !session?.user?.email) return;

    // Fetch the secure signed URL from the access API
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
  }, [id, session?.user?.email]);

  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'Arial'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📖</div>
          <h2 style={{ color: '#667eea' }}>Loading your book...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'Arial'
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: '#dc3545' }}>{error}</h2>
          <button 
            onClick={() => router.push('/books')}
            style={{
              marginTop: '20px',
              padding: '12px 30px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ← Back to Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar */}
      <div style={{
        padding: '10px 20px',
        background: '#667eea',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => router.push('/books')}
          style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ← Back
        </button>
        <h3 style={{ margin: 0, fontSize: '16px' }}>📖 BookNaija Reader</h3>
        <div style={{ width: '80px' }}></div>
      </div>

      {/* PDF Viewer - Full Screen */}
      <iframe
        src={pdfUrl}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          background: '#f5f5f5'
        }}
        title="PDF Reader"
      />
    </div>
  );
}
