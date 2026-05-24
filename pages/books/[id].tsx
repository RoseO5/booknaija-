'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function BookDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/books/admin-list`).then(r => r.json()).then(data => {
      const all = [...data.pending, ...data.flagged, ...(data.all || [])];
      const found = all.find((b: any) => b._id === id);
      setBook(found || { error: 'Book not found' });
      setLoading(false);
    });
  }, [id]);

  const handleReport = async () => {
    if (!id || reported) return;
    await fetch('/api/books/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: id })
    });
    setReported(true);
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  if (book?.error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Book not found</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#667eea' }}>{book?.title}</h1>
      <p style={{ color: '#666' }}>By {book?.authorName}</p>
      <div style={{ background: book?.status === 'pending' ? '#fff3cd' : book?.status === 'flagged' ? '#f8d7da' : '#d4edda', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
        Status: <strong>{book?.status?.toUpperCase()}</strong>
        {book?.status !== 'published' && <span> • Awaiting admin review</span>}
      </div>

      {book?.status === 'published' && (
        <a href={book?.pdfUrl} target="_blank" style={{ display: 'inline-block', padding: '12px 24px', background: '#667eea', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>📖 Read Book</a>
      )}

      <button 
        onClick={handleReport} 
        disabled={reported}
        style={{ marginLeft: '10px', padding: '12px 24px', background: reported ? '#6c757d' : '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
      >
        {reported ? '✅ Reported' : '🚩 Report This Book'}
      </button>

      {book?.abuseFlags?.length > 0 && (
        <p style={{ marginTop: '15px', fontSize: '14px', color: '#dc3545' }}>⚠️ Flags: {book.abuseFlags.join(', ')}</p>
      )}
    </div>
  );
}
