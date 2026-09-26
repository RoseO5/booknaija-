'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function AdminTriviaDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviewData, setReviewData] = useState<any>(null);
  const [tournamentData, setTournamentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooks, setSelectedBooks] = useState<any[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [reviewingBook, setReviewingBook] = useState<any>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch(`/api/trivia/admin-review`)
        .then(r => r.json())
        .then(d => {
          setReviewData(d);
          setSelectedBooks(d.autoSelected || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));

      fetch(`/api/trivia/admin?month=${currentMonth}`)
        .then(r => r.json())
        .then(d => setTournamentData(d))
        .catch(() => {});
    }
  }, [status, currentMonth]);

  const handleLaunch = async () => {
    if (!confirm(`🚀 Launch tournament with ${selectedBooks.length} books?`)) return;
    setIsLaunching(true);
    try {
      const res = await fetch('/api/trivia/admin-launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', selectedBooks })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        window.location.reload();
      } else {
        alert('❌ ' + data.error);
      }
    } catch (err) {
      alert('❌ Network error');
    } finally {
      setIsLaunching(false);
    }
  };

  const handleStop = async () => {
    if (!confirm('🔴 Close tournament early? This cannot be undone!')) return;
    try {
      const res = await fetch('/api/trivia/admin-launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        window.location.reload();
      }
    } catch (err) {
      alert('❌ Network error');
    }
  };

  const toggleBookSelection = (book: any) => {
    const exists = selectedBooks.find(b => b.bookId === book.bookId);
    if (exists) {
      setSelectedBooks(selectedBooks.filter(b => b.bookId !== book.bookId));
    } else {
      if (selectedBooks.length < 5) {
        setSelectedBooks([...selectedBooks, book]);
      } else {
        alert('⚠️ You can only select 5 books maximum!');
      }
    }
  };

  const handleQuestionAction = async (bookId: string, questionIndex: number, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/trivia/update-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, questionIndex, action })
      });
      const data = await res.json();
      if (data.success) {
        const r = await fetch('/api/trivia/admin-review').then(r => r.json());
        setReviewData(r);
        const updatedBook = r.allBooks.find((b: any) => b.bookId === bookId);
        setReviewingBook(updatedBook || null);
      } else {
        alert('❌ ' + data.error);
      }
    } catch (err) {
      alert('❌ Network error');
    }
  };

  if (status === 'loading' || loading) {
    return <div style={{padding:'40px',textAlign:'center'}}>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  const tournament = tournamentData?.tournament;
  const isTournamentActive = tournament?.status === 'active';

  return (
    <div style={{padding:'20px',maxWidth:'1000px',margin:'0 auto',fontFamily:'Arial'}}>
      <button onClick={() => router.push('/admin')} style={{marginBottom:'20px',padding:'8px 16px',background:'#f1f1f1',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'bold'}}>
        ← Back to Main Admin
      </button>

      <h1 style={{color:'#667eea',marginBottom:'10px'}}>🏆 Trivia Tournament Control Center</h1>
      <p style={{color:'#666',marginBottom:'30px'}}>Month: <strong>{currentMonth}</strong></p>

      <div style={{
        background: isTournamentActive ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' :
                    tournament?.status === 'closed' ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' :
                    'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
        padding:'30px',borderRadius:'16px',color:'white',textAlign:'center',marginBottom:'30px',
        boxShadow:'0 8px 24px rgba(0,0,0,0.2)'
      }}>
        <div style={{fontSize:'14px',opacity:0.9,marginBottom:'10px'}}>TOURNAMENT STATUS</div>
        <div style={{fontSize:'36px',fontWeight:'bold',marginBottom:'10px',textTransform:'uppercase'}}>
          {isTournamentActive ? '🟢 ACTIVE' : tournament?.status === 'closed' ? '🔴 CLOSED' : '🟡 READY TO LAUNCH'}
        </div>
        {isTournamentActive && tournament?.daysLeft !== undefined && (
          <div style={{fontSize:'20px'}}>⏰ {tournament.daysLeft} day(s) remaining</div>
        )}
      </div>

      <div style={{background:'#fff3cd',padding:'20px',borderRadius:'12px',border:'2px solid #ffc107',marginBottom:'30px'}}>
        <h3 style={{color:'#856404',marginTop:0,marginBottom:'10px'}}>📋 Today's Action Items</h3>
        <p style={{color:'#856404',margin:0,fontSize:'16px',lineHeight:'1.6'}}>
          {tournament?.instructions?.today || 'Tournament has not started yet. It opens on the 1st of the month or when you click Launch.'}
        </p>
      </div>

      {!isTournamentActive && tournament?.status !== 'closed' && (
        <div style={{background:'white',padding:'25px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',marginBottom:'30px',textAlign:'center'}}>
          <h3 style={{marginTop:0,color:'#333',marginBottom:'15px'}}>🚀 Launch Tournament</h3>
          <p style={{color:'#666',marginBottom:'20px'}}>The tournament will auto-start on the 1st of the month, or you can launch it manually now!</p>
          <button
            onClick={handleLaunch}
            disabled={isLaunching || selectedBooks.length === 0}
            style={{padding:'15px 40px',background: isLaunching ? '#ccc' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',color:'white',border:'none',borderRadius:'12px',fontWeight:'bold',fontSize:'18px',cursor: isLaunching ? 'not-allowed' : 'pointer',boxShadow:'0 4px 16px rgba(40,167,69,0.4)'}}
          >
            {isLaunching ? '⏳ Launching...' : `🚀 Launch Tournament (${selectedBooks.length} Books)`}
          </button>
        </div>
      )}

      {isTournamentActive && (
        <div style={{background:'white',padding:'25px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',marginBottom:'30px',textAlign:'center'}}>
          <h3 style={{marginTop:0,color:'#333',marginBottom:'15px'}}>🔴 Close Tournament Early</h3>
          <p style={{color:'#666',marginBottom:'20px'}}>Tournament will auto-close after 7 days, or you can close it now.</p>
          <button onClick={handleStop} style={{padding:'12px 30px',background:'#dc3545',color:'white',border:'none',borderRadius:'8px',fontWeight:'bold',fontSize:'16px',cursor:'pointer'}}>
            🔴 Close Tournament Now
          </button>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'15px',marginBottom:'30px'}}>
        <div style={{background:'white',padding:'20px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',textAlign:'center'}}>
          <div style={{fontSize:'14px',color:'#666'}}>Total Players</div>
          <div style={{fontSize:'32px',fontWeight:'bold',color:'#667eea'}}>{tournament?.totalPlayers || 0}</div>
        </div>
        <div style={{background:'white',padding:'20px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',textAlign:'center'}}>
          <div style={{fontSize:'14px',color:'#666'}}>Completed Quiz</div>
          <div style={{fontSize:'32px',fontWeight:'bold',color:'#28a745'}}>{tournament?.finishedPlayers || 0}</div>
        </div>
        <div style={{background:'white',padding:'20px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',textAlign:'center'}}>
          <div style={{fontSize:'14px',color:'#666'}}>Prize Pool</div>
          <div style={{fontSize:'32px',fontWeight:'bold',color:'#dc3545'}}>₦{(tournament?.totalPoolNaira || 0).toLocaleString()}</div>
        </div>
      </div>

      {tournament?.winners && tournament.winners.length > 0 && (
        <div style={{background:'white',padding:'25px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',marginBottom:'30px'}}>
          <h3 style={{marginTop:0,color:'#333',marginBottom:'20px'}}>🏆 Current Leaders (Top 3)</h3>
          <div style={{display:'flex',flexDirection:'column',gap:'15px'}}>
            {tournament.winners.map((w: any, i: number) => (
              <div key={i} style={{background: i === 0 ? '#fff3cd' : i === 1 ? '#e7f3ff' : '#f8d7da', padding:'20px',borderRadius:'8px', border: `2px solid ${i === 0 ? '#ffc107' : i === 1 ? '#b8daff' : '#f5c6cb'}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'10px'}}>
                  <div>
                    <div style={{fontSize:'20px',fontWeight:'bold',color:'#333'}}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {w.userName || 'Anonymous'}</div>
                    <div style={{fontSize:'14px',color:'#666',marginTop:'5px'}}>📧 {w.userEmail}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'24px',fontWeight:'bold',color:'#28a745'}}>{w.score} correct</div>
                    <div style={{fontSize:'13px',color:'#666'}}>Time: {Math.floor(w.completionTime / 60)}m {w.completionTime % 60}s</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{background:'white',padding:'25px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',marginBottom:'30px'}}>
        <h3 style={{marginTop:0,color:'#333',marginBottom:'20px'}}>📚 Select 5 Featured Books</h3>
        <p style={{color:'#666',marginBottom:'15px',fontSize:'14px'}}>Click to select/deselect. The system auto-selected the top 5, but you can override!</p>

        {reviewData?.allBooks?.length === 0 ? (
          <p style={{color:'#999',textAlign:'center',padding:'20px'}}>No books with trivia questions yet.</p>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:'15px'}}>
            {reviewData?.allBooks?.map((book: any, i: number) => {
              const isSelected = selectedBooks.find(b => b.bookId === book.bookId);
              return (
                <div key={i} style={{background: isSelected ? '#e7f3ff' : '#f8f9fa', padding:'15px', borderRadius:'8px', border: isSelected ? '2px solid #667eea' : '2px solid #ddd', transition:'all 0.2s'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:'10px'}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:'bold',color:'#333',marginBottom:'5px'}}>{book.bookTitle}</div>
                      <div style={{fontSize:'13px',color:'#666'}}>by {book.authorName}</div>
                    </div>
                    {isSelected && <div style={{background:'#667eea',color:'white',padding:'4px 8px',borderRadius:'12px',fontSize:'12px',fontWeight:'bold'}}>✓ Selected</div>}
                  </div>
                  <div style={{fontSize:'12px',color:'#666',marginTop:'10px'}}>
                    ✅ {book.approvedQuestions} approved • {book.flaggedQuestions > 0 && <span style={{color:'#dc3545'}}> ⚠️ {book.flaggedQuestions} flagged</span>}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setReviewingBook(book); }}
                    style={{marginTop:'10px', width:'100%', padding:'8px', background:'#667eea', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontWeight:'bold'}}
                  >
                    👁️ Review & Approve Questions
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBookSelection(book); }}
                    style={{marginTop:'8px', width:'100%', padding:'8px', background: isSelected ? '#dc3545' : '#28a745', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontWeight:'bold'}}
                  >
                    {isSelected ? '❌ Deselect Book' : '✅ Select Book'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviewingBook && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px'}}>
          <div style={{background:'white', borderRadius:'12px', padding:'25px', maxWidth:'600px', width:'100%', maxHeight:'80vh', overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <h3 style={{margin:0, color:'#333'}}>Review: {reviewingBook.bookTitle}</h3>
              <button onClick={() => setReviewingBook(null)} style={{background:'none', border:'none', fontSize:'28px', cursor:'pointer', color:'#666', lineHeight:1}}>×</button>
            </div>
            {reviewingBook.questions.map((q: any, idx: number) => (
              <div key={idx} style={{background: q.approved ? '#d4edda' : q.flagged ? '#f8d7da' : '#f8f9fa', padding:'15px', borderRadius:'8px', marginBottom:'15px', border: '1px solid #ddd'}}>
                <div style={{fontWeight:'bold', marginBottom:'10px', color:'#333'}}>Q{idx+1}: {q.question}</div>
                {q.flagReason && <div style={{color:'#dc3545', fontSize:'12px', marginBottom:'5px', fontWeight:'bold'}}>⚠️ Auto-Flag: {q.flagReason}</div>}
                <div style={{fontSize:'14px', color:'#555', marginBottom:'10px', lineHeight:'1.6'}}>
                  <div>A) {q.optionA || q.options?.[0] || 'N/A'}</div>
                  <div>B) {q.optionB || q.options?.[1] || 'N/A'}</div>
                  <div>C) {q.optionC || q.options?.[2] || 'N/A'}</div>
                  <div>D) {q.optionD || q.options?.[3] || 'N/A'}</div>
                  <div style={{marginTop:'8px', fontWeight:'bold', color:'#28a745'}}>Correct: {q.correctAnswer || q.answer || 'N/A'}</div>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                  <button onClick={() => handleQuestionAction(reviewingBook.bookId, idx, 'approve')} disabled={q.approved} style={{padding:'6px 12px', background: q.approved ? '#ccc' : '#28a745', color:'white', border:'none', borderRadius:'4px', cursor: q.approved ? 'not-allowed' : 'pointer', fontWeight:'bold'}}>
                    {q.approved ? '✅ Approved' : '✅ Approve'}
                  </button>
                  <button onClick={() => handleQuestionAction(reviewingBook.bookId, idx, 'reject')} disabled={q.flagged} style={{padding:'6px 12px', background: q.flagged ? '#ccc' : '#dc3545', color:'white', border:'none', borderRadius:'4px', cursor: q.flagged ? 'not-allowed' : 'pointer', fontWeight:'bold'}}>
                    {q.flagged ? '🚫 Rejected' : '🚫 Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
