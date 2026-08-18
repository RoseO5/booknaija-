'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function AdminPreview() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [bookTitle, setBookTitle] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || !session?.user?.email) return;

    // Fetch the secure URL from admin preview API
    fetch(`/api/books/admin-preview?bookId=${id}&adminEmail=${encodeURIComponent(session.user.email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.url) {
          setPdfUrl(data.url);
          setBookTitle(data.title || 'Book Preview');
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial', background: '#f5f5f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📖</div>
          <h2 style={{ color: '#667eea' }}>Loading preview...</h2>
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
          <button onClick={() => router.push('/admin')} style={{ marginTop: '20px', padding: '12px 30px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            ← Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#333' }}>
      {/* Header Bar */}
      <div style={{ padding: '10px 20px', background: '#6f42c1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <button onClick={() => router.push('/admin')} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Back to Admin
        </button>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>🛡️ Admin Preview</h3>
          <span style={{ fontSize: '12px', opacity: 0.9 }}>{bookTitle}</span>
        </div>
        <div style={{ width: '100px' }}></div>
      </div>

      {/* PDF Viewer using Mozilla's engine */}
      <iframe
        src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`}
        style={{ flex: 1, width: '100%', border: 'none', background: '#525659' }}
        title="Admin PDF Preview"
        allow="fullscreen"
      />
    </div>
  );
}
