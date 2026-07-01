'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Books() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/books/list')
      .then(r => r.json())
      .then(data => {
        setBooks(Array.isArray(data.books) ? data.books : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{padding:'40px',textAlign:'center'}}>Loading books...</div>;

  return (
    <div style={{padding:'20px',maxWidth:'800px',margin:'0 auto',fontFamily:'Arial'}}>
      <h1 style={{color:'#667eea',textAlign:'center'}}>📚 Browse Books</h1>
      <p style={{textAlign:'center',color:'#666',marginBottom:'30px'}}>
        Premium access: ₦1000/month to read all books
      </p>

      {books.length === 0 ? (
        <div style={{textAlign:'center',padding:'40px',background:'#f8f9fa',borderRadius:'12px'}}>
          <p style={{color:'#666'}}>No books available yet.</p>
          <a href="/upload" style={{color:'#667eea',fontWeight:'bold'}}>Upload the first book →</a>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:'20px'}}>
          {books.map((book: any) => (
            <Link key={book._id} href={`/books/${book._id}`} style={{textDecoration:'none',color:'inherit'}}>
              <div style={{background:'white',borderRadius:'12px',overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.1)',border:'1px solid #eee'}}>
                <img src={book.coverUrl} alt={book.title} style={{width:'100%',height:'200px',objectFit:'cover'}} />
                <div style={{padding:'15px'}}>
                  <h3 style={{margin:'0 0 5px',color:'#333',fontSize:'16px'}}>{book.title}</h3>
                  <p style={{margin:'0 0 10px',color:'#666',fontSize:'14px'}}>by {book.authorName}</p>
                  <div style={{background:'#667eea',color:'white',padding:'8px',borderRadius:'6px',textAlign:'center',fontSize:'13px',fontWeight:'bold'}}>
                    📖 Read Book
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{textAlign:'center',marginTop:'40px'}}>
        <a href="/leaderboard" style={{color:'#667eea',fontWeight:'bold'}}>🏆 View Leaderboard →</a>
      </div>
    </div>
  );
}
