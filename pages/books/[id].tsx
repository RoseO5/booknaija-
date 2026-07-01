'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PremiumGate from '../../components/PremiumGate';
export default function BookDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState<any>(null);
  useEffect(() => {
    if (!id) return;
    fetch('/api/books/admin-list').then(r => r.json()).then(data => {
      const all = [...(data.pending || []), ...(data.flagged || []), ...(data.all || [])];
      setBook(all.find((b: any) => b._id === id) || { error: 'Not found' });
    });
  }, [id]);
  if (!book) return <div style={{padding:'20px',textAlign:'center'}}>Loading...</div>;
  if (book.error) return <div style={{padding:'20px',textAlign:'center',color:'red'}}>Book not found</div>;
  return (
    <div style={{padding:'20px',maxWidth:'600px',margin:'0 auto',fontFamily:'Arial'}}>
      <img src={book.coverUrl} alt={book.title} style={{width:'100%',maxWidth:'300px',borderRadius:'12px',marginBottom:'20px'}} />
      <h1 style={{color:'#667eea'}}>{book.title}</h1>
      <p style={{color:'#666',marginBottom:'15px'}}>By {book.authorName}</p>
      <PremiumGate>
        <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer" style={{display:'inline-block',padding:'15px 30px',background:'#667eea',color:'white',textDecoration:'none',borderRadius:'8px',fontWeight:'bold'}}>
          📖 Read Book Now
        </a>
      </PremiumGate>
    </div>
  );
}
