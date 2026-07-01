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
  const timerRef = useRef<any>(null);

  // Fetch book data
  useEffect(() => {
    if (!id) return;
    fetch('/api/books/admin-list').then(r => r.json()).then(data => {
      const all = [...(data.pending || []), ...(data.flagged || []), ...(data.all || [])];
      setBook(all.find((b: any) => b._id === id) || { error: 'Not found' });
    });
  }, [id]);

  // Start timer when user is reading (has active subscription)
  useEffect(() => {
    if (!session?.user?.subscription?.active) return;
    if (!book || book.error) return;

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

  if (!book) return <div style={{padding:'20px',textAlign:'center'}}>Loading...</div>;
  if (book.error) return <div style={{padding:'20px',textAlign:'center',color:'red'}}>Book not found</div>;

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const showMarkButton = elapsed >= 300 && !markedRead; // 5 minutes = 300 seconds

  return (
    <div style={{padding:'20px',maxWidth:'600px',margin:'0 auto',fontFamily:'Arial'}}>
      <img src={book.coverUrl} alt={book.title} style={{width:'100%',maxWidth:'300px',borderRadius:'12px',marginBottom:'20px'}} />
      <h1 style={{color:'#667eea'}}>{book.title}</h1>
      <p style={{color:'#666',marginBottom:'15px'}}>By {book.authorName}</p>

      <PremiumGate>
        {/* Reading Timer - Only visible to premium users */}
        {session?.user?.subscription?.active && (
          <div style={{background:'#e7f3ff',padding:'12px',borderRadius:'8px',marginBottom:'15px',fontSize:'14px'}}>
            ⏱️ Reading time: <strong>{minutes}m {seconds}s</strong>
            {!markedRead && elapsed < 300 && (
              <span style={{color:'#666',marginLeft:'10px'}}>
                (Read for 5 minutes to mark as complete)
              </span>
            )}
          </div>
        )}

        {/* Open Book Button */}
        <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer nofollow" 
           style={{display:'inline-block',padding:'15px 30px',background:'#667eea',color:'white',textDecoration:'none',borderRadius:'8px',fontWeight:'bold',marginRight:'10px'}}>
          📖 Read Book
        </a>

        {/* Mark as Read Button - Only after 5 minutes */}
        {showMarkButton && (
          <button onClick={handleMarkAsRead}
            style={{padding:'15px 30px',background:'#28a745',color:'white',border:'none',borderRadius:'8px',fontWeight:'bold',cursor:'pointer'}}>
            ✅ Mark as Read
          </button>
        )}

        {/* Success Message */}
        {markedRead && readResult && (
          <div style={{background:'#d4edda',padding:'15px',borderRadius:'8px',marginTop:'15px',color:'#155724'}}>
            <strong>✅ Book marked as read!</strong><br/>
            📚 Competition progress: <strong>{readResult.progressToPrize}</strong><br/>
            <span style={{fontSize:'13px'}}>
              {readResult.totalBooksRead >= 50 
                ? '🎉 You qualify for the ₦5,000 reader prize!' 
                : `Read ${50 - readResult.totalBooksRead} more books in 6 months to qualify`}
            </span>
          </div>
        )}
      </PremiumGate>
    </div>
  );
}
