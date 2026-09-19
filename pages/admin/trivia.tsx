'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function AdminTriviaDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch(`/api/trivia/admin?month=${currentMonth}`)
        .then(r => r.json())
        .then(d => {
          setData(d);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, currentMonth]);

  if (status === 'loading' || loading) {
    return <div style={{padding:'40px',textAlign:'center'}}>Loading admin dashboard...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  const { tournament, featuredBooks, instructions } = data;

  return (
    <div style={{padding:'20px',maxWidth:'1000px',margin:'0 auto',fontFamily:'Arial'}}>
      <button onClick={() => router.push('/admin')} style={{marginBottom:'20px',padding:'8px 16px',background:'#f1f1f1',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'bold'}}>
        ← Back to Main Admin
      </button>

      <h1 style={{color:'#667eea',marginBottom:'10px'}}>🏆 Admin Trivia Dashboard</h1>
      <p style={{color:'#666',marginBottom:'30px'}}>Month: <strong>{tournament.month}</strong></p>

      {/* TOURNAMENT STATUS */}
      <div style={{
        background: tournament.status === 'active' ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' :
                    tournament.status === 'closed' ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' :
                    'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
        padding:'30px',borderRadius:'16px',color:'white',textAlign:'center',marginBottom:'30px',
        boxShadow:'0 8px 24px rgba(0,0,0,0.2)'
      }}>
        <div style={{fontSize:'14px',opacity:0.9,marginBottom:'10px'}}>TOURNAMENT STATUS</div>
        <div style={{fontSize:'36px',fontWeight:'bold',marginBottom:'10px',textTransform:'uppercase'}}>
          {tournament.status === 'active' ? '🟢 ACTIVE' : tournament.status === 'closed' ? '🔴 CLOSED' : '🟡 UPCOMING'}
        </div>
        {tournament.status === 'active' && (
          <div style={{fontSize:'20px'}}>⏰ {tournament.daysLeft} day(s) remaining</div>
        )}
      </div>

      {/* TODAY'S INSTRUCTIONS */}
      <div style={{background:'#fff3cd',padding:'20px',borderRadius:'12px',border:'2px solid #ffc107',marginBottom:'30px'}}>
        <h3 style={{color:'#856404',marginTop:0,marginBottom:'10px'}}>📋 Today's Action Items</h3>
        <p style={{color:'#856404',margin:0,fontSize:'16px',lineHeight:'1.6'}}>
          {instructions.today}
        </p>
      </div>

      {/* STATS GRID */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'15px',marginBottom:'30px'}}>
        <div style={{background:'white',padding:'20px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',textAlign:'center'}}>
          <div style={{fontSize:'14px',color:'#666'}}>Total Players</div>
          <div style={{fontSize:'32px',fontWeight:'bold',color:'#667eea'}}>{tournament.totalPlayers}</div>
        </div>
        <div style={{background:'white',padding:'20px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',textAlign:'center'}}>
          <div style={{fontSize:'14px',color:'#666'}}>Completed Quiz</div>
          <div style={{fontSize:'32px',fontWeight:'bold',color:'#28a745'}}>{tournament.finishedPlayers}</div>
        </div>
        <div style={{background:'white',padding:'20px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',textAlign:'center'}}>
          <div style={{fontSize:'14px',color:'#666'}}>Prize Pool</div>
          <div style={{fontSize:'32px',fontWeight:'bold',color:'#dc3545'}}>₦{tournament.totalPoolNaira.toLocaleString()}</div>
        </div>
      </div>

      {/* FEATURED BOOKS */}
      <div style={{background:'white',padding:'25px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',marginBottom:'30px'}}>
        <h3 style={{marginTop:0,color:'#333',marginBottom:'20px'}}>📚 This Month's Featured Books</h3>
        {featuredBooks.length === 0 ? (
          <p style={{color:'#999',textAlign:'center',padding:'20px'}}>No books featured yet. Authors need to submit trivia questions at /author-trivia.</p>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))',gap:'15px'}}>
            {featuredBooks.map((book: any, i: number) => (
              <div key={i} style={{background:'#f8f9fa',padding:'15px',borderRadius:'8px',borderLeft:'4px solid #667eea'}}>
                <div style={{fontWeight:'bold',color:'#333',marginBottom:'5px'}}>{book.title}</div>
                <div style={{fontSize:'13px',color:'#666'}}>by {book.authorName}</div>
                <div style={{fontSize:'12px',color:'#667eea',marginTop:'5px'}}>{book.questionCount} questions submitted</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
