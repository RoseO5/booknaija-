'use client';

import { useState, useEffect } from 'react';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('000000000000000000000001'); // Mock user ID for testing

  useEffect(() => {
    fetch('/api/books/list')
      .then(res => res.json())
      .then(data => {
        setBooks(data.books || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleReadBook = async (bookId, bookTitle) => {
    const mins = prompt(`How many minutes did you read "${bookTitle}"?`);
    const pages = prompt('How many pages did you read?');

    if (mins && pages) {
      const res = await fetch('/api/reading/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookId, 
          bookTitle, 
          minutesRead: mins, 
          pagesRead: pages,
          userId
        })
      });

      const result = await res.json();
      
      if (result.success) {
        alert(result.message + '\n\n' + (result.prizeMessage || ''));
        window.location.reload();
      } else {
        alert('❌ Error: ' + result.error);
      }
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading books...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '30px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#667eea', margin: 0 }}>📚 Available Books ({books.length})</h1>
          <a href="/" style={{ color: '#667eea', textDecoration: 'none' }}>← Home</a>
        </div>

        <div style={{ background: '#d1ecf1', padding: '15px', borderRadius: '10px', marginBottom: '25px', borderLeft: '4px solid #17a2b8' }}>
          <strong>🎯 Prize Alert:</strong> Read 50 UNIQUE books in 6 months to enter our ₦5,000 prize draw (top 3 readers win)!
        </div>

        {books.length === 0 ? (
          <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>No books available yet. Check back soon!</p>
            <a href="/admin" style={{ display: 'inline-block', marginTop: '20px', background: '#667eea', color: 'white', padding: '10px 30px', borderRadius: '6px', textDecoration: 'none' }}>➕ Upload First Book</a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
            {books.map((book: any) => (
              <div key={book._id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 3px 10px rgba(0,0,0,0.1)' }}>
                <div style={{ height: '200px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '6rem' }}>📖</span>
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem' }}>{book.title}</h3>
                  <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '0.95rem' }}><strong>Author:</strong> {book.authorName}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#667eea', fontSize: '0.9rem', marginBottom: '15px' }}>
                    <span>📖 {book.pages || 'N/A'} pages</span>
                    <span>🏷️ {book.category}</span>
                  </div>
                  <button onClick={() => handleReadBook(book._id, book.title)} style={{ width: '100%', background: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                    📖 Read Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '40px', textAlign: 'center', padding: '30px', background: '#e7f3ff', borderRadius: '12px' }}>
          <h2 style={{ color: '#007bff', margin: '0 0 15px 0' }}>🏆 Monthly Prize Draw</h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}><strong>₦5,000</strong> for each of the top 3 readers every 6 months!</p>
          <p style={{ margin: '0 0 20px 0' }}><strong>Requirements:</strong> Read 50+ UNIQUE books within 6 months</p>
          <a href="/dashboard" style={{ display: 'inline-block', background: '#007bff', color: 'white', padding: '12px 30px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>📊 View Dashboard</a>
        </div>
      </div>
    </div>
  );
}
