'use client';
import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

const GENRES = ['All', 'Fiction', 'Christian Devotionals', 'Poetry', 'Self-Help', 'Non-Fiction', 'Educational'];

export default function Books() {
  const { data: session, status } = useSession();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  useEffect(() => {
    fetch('/api/books/list')
      .then(r => r.json())
      .then(data => {
        setBooks(Array.isArray(data.books) ? data.books : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sub = session?.user?.subscription as any;
  const isActive = sub && (sub.active === true || sub.status === 'active');
  const isPending = sub && sub.status === 'pending';

  const filteredBooks = books.filter((book: any) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || (book.genre || '').trim().toLowerCase() === selectedGenre.toLowerCase();
    return matchesSearch && matchesGenre;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#667eea', fontSize: '32px', marginBottom: '10px' }}>📚 Browse Books</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>Discover Nigerian stories • Premium access ₦1000/month</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Search by book title or author name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '14px', fontSize: '16px', border: '2px solid #e0e0e0', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            style={{
              padding: '10px 20px',
              background: selectedGenre === genre ? '#667eea' : '#f1f1f1',
              color: selectedGenre === genre ? 'white' : '#333',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* ✅ BOLD WHATSAPP BANNER: ALWAYS VISIBLE, dynamically adapts to login status */}
      <div style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', padding: '20px', borderRadius: '12px', color: 'white', textAlign: 'center', marginBottom: '25px', boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '20px', fontWeight: 'bold' }}>💬 Exclusive: BookNaija Readers Community</h3>
        
        {status === 'authenticated' && session?.user?.email ? (
          <>
            <p style={{ margin: '0 0 15px', fontSize: '15px', opacity: 0.95, lineHeight: '1.5' }}>
              Welcome back! Connect with fellow readers, get book updates, and be part of our growing literary family.
            </p>
            <a 
              href={`https://wa.me/2348142750728?text=${encodeURIComponent(`Hello Rose! I am a subscribed reader on BookNaija. My registered email is: ${session.user.email}. Please approve my request to join the Readers WhatsApp Group. Thank you!`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '12px 24px', background: 'white', color: '#128C7E', textDecoration: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            >
              💚 Request to Join WhatsApp Group
            </a>
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 15px', fontSize: '15px', opacity: 0.95, lineHeight: '1.5' }}>
              Connect with fellow readers, get book updates, and be part of our growing literary family!
            </p>
            <button 
              onClick={() => signIn('google')}
              style={{ display: 'inline-block', padding: '12px 24px', background: 'white', color: '#128C7E', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', cursor: 'pointer' }}
            >
              🔐 Sign In to Request Access
            </button>
          </>
        )}
      </div>

      {/* Reader Info (if logged in) */}
      {status === 'authenticated' && session?.user && (
        <div style={{ background: isActive ? '#d4edda' : (isPending ? '#fff3cd' : '#f8d7da'), padding: '15px', borderRadius: '12px', marginBottom: '25px', border: `1px solid ${isActive ? '#c3e6cb' : (isPending ? '#ffeaa7' : '#f5c6cb')}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <strong style={{ color: isActive ? '#155724' : (isPending ? '#856404' : '#721c24') }}>👋 Welcome, {session.user.name || 'Reader'}!</strong>
              <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#666' }}>
                {isActive ? '✅ Premium Active • Read unlimited books' : (isPending ? ' ⏳ Payment Pending • Awaiting activation' : '⭐ Subscribe to read all books • ₦1000/month')}
              </p>
            </div>
            {!isActive && !isPending && (
              <a href="/payment" style={{ padding: '10px 20px', background: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>💳 Subscribe Now</a>
            )}
            {isPending && (
              <span style={{ padding: '10px 20px', background: '#ffc107', color: '#856404', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>⏳ Awaiting Activation</span>
            )}
          </div>
        </div>
      )}

      {/* Not Logged In Banner */}
      {status === 'unauthenticated' && (
        <div style={{ background: '#e7f3ff', padding: '15px', borderRadius: '12px', marginBottom: '25px', textAlign: 'center', border: '1px solid #b8daff' }}>
          <p style={{ margin: '0 0 10px', color: '#004085' }}>🔐 Sign in to track your reading progress and compete for prizes!</p>
          <button onClick={() => signIn('google')} style={{ padding: '10px 25px', background: '#4285f4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔐 Sign in with Google</button>
        </div>
      )}

      {/* Books Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><p style={{ color: '#666', fontSize: '18px' }}>Loading books...</p></div>
      ) : filteredBooks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8f9fa', borderRadius: '12px' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>📚</div>
          <h3 style={{ color: '#666', marginBottom: '10px' }}>No books found</h3>
          <p style={{ color: '#999' }}>Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' }}>
          {filteredBooks.map((book: any) => (
            <Link key={book._id} href={`/books/${book._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #eee', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
              >
                <img src={book.coverUrl || 'https://via.placeholder.com/400x600/667eea/ffffff?text=' + encodeURIComponent(book.title)} alt={book.title} style={{ width: '100%', height: '280px', objectFit: 'cover', borderBottom: '1px solid #eee' }} />
                <div style={{ padding: '15px' }}>
                  <span style={{ display: 'inline-block', padding: '4px 10px', background: '#e7f3ff', color: '#0056b3', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {book.genre || 'Non-Fiction'}
                  </span>
                  <h3 style={{ margin: '0 0 8px', color: '#333', fontSize: '16px', lineHeight: '1.3', minHeight: '42px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{book.title}</h3>
                  <p style={{ margin: '0 0 12px', color: '#666', fontSize: '14px' }}>by {book.authorName}</p>
                  <div style={{ background: '#667eea', color: 'white', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>📖 Read Book</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '50px', paddingTop: '30px', borderTop: '1px solid #eee' }}>
        <p style={{ color: '#666', marginBottom: '15px' }}>🏆 Compete to read 50 books in 6 months and win ₦5,000!</p>
        <a href="/leaderboard" style={{ color: '#667eea', fontWeight: 'bold', textDecoration: 'none' }}>🏆 View Leaderboard →</a>
      </div>
    </div>
  );
}
