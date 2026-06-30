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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch('/api/books/admin-list')
      .then(r => r.json())
      .then(data => {
        const all = [...(data.pending || []), ...(data.flagged || []), ...(data.all || [])];
        const found = all.find((b: any) => b._id === id);
        if (found?.status === 'published' || session?.user?.role === 'admin') {
          setBook(found);
        } else {
          setBook({ error: 'Book not available' });
        }
        setLoading(false);
      })
      .catch(() => {
        setBook({ error: 'Failed to load book' });
        setLoading(false);
      });
  }, [id, session]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  if (book?.error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{book.error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial' }}>
      <img src={book.coverUrl} alt={book.title} style={{ width: '100%', maxWidth: '300px', borderRadius: '12px', marginBottom: '20px' }} />
      <h1 style={{ color: '#667eea', marginBottom: '5px' }}>{book.title}</h1>
      <p style={{ color: '#666', marginBottom: '15px' }}>By {book.authorName}</p>
      
      <PremiumGate>
        <div style={{ marginTop: '20px', background: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
          <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '15px 30px', background: '#667eea', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            📖 Read Book Now
          </a>
        </div>
      </PremiumGate>
    </div>
  );
}
