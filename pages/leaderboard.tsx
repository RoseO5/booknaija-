'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function Leaderboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myProgress, setMyProgress] = useState<any>(null);

  // Calculate current cycle info
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const cycleStart = currentMonth < 6 
    ? new Date(currentYear, 0, 1)  // Jan 1 if before June
    : new Date(currentYear, 6, 1); // July 1 if before December
  const cycleEnd = currentMonth < 6 
    ? new Date(currentYear, 5, 30) // June 30
    : new Date(currentYear + 1, 0, 31); // Jan 31 next year
  const daysLeft = Math.ceil((cycleEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  useEffect(() => {
    fetch('/api/competition/leaderboard')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch logged-in user's personal progress
    if (session?.user?.email) {
      fetch('/api/competition/my-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email })
      })
      .then(r => r.json())
      .then(d => setMyProgress(d))
      .catch(() => {});
    }
  }, [session]);

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#667eea', fontSize: '32px', marginBottom: '10px' }}>📊 Reading Status</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Tracking our community's dedication to Nigerian literature
        </p>
      </div>

      {/* 🎯 PERSONAL PROGRESS TRACKER (For Logged-in Users) */}
      {session?.user && (
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          padding: '25px', 
          borderRadius: '12px', 
          marginBottom: '25px',
          color: 'white'
        }}>
          <h3 style={{ marginTop: 0, textAlign: 'center' }}>🎯 Your Reading Journey</h3>
          <p style={{ textAlign: 'center', opacity: 0.9, marginBottom: '20px' }}>
            Welcome back, {session.user.name || 'Reader'}!
          </p>

          {myProgress ? (
            <>
              {/* Progress Bar */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>Books Read: <strong>{myProgress.booksRead}/50</strong></span>
                  <span>{Math.min(100, Math.round((myProgress.booksRead / 50) * 100))}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', height: '12px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      background: '#28a745', 
                      height: '100%', 
                      width: `${Math.min(100, (myProgress.booksRead / 50) * 100)}%`,
                      transition: 'width 0.5s'
                    }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '15px' }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{myProgress.booksRead}</div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>Books Read</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{myProgress.totalMinutes}</div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>Minutes</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{daysLeft}</div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>Days Left</div>
                </div>
              </div>

              {/* Qualification Status */}
              <div style={{ 
                background: myProgress.qualified ? 'rgba(40,167,69,0.3)' : 'rgba(255,193,7,0.3)', 
                padding: '12px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                {myProgress.qualified ? (
                  <strong>✅ You've Qualified for the Bi-Annual Literary Grant!</strong>
                ) : (
                  <strong>📚 Read {50 - myProgress.booksRead} more books to qualify</strong>
                )}
              </div>
            </>
          ) : (
            <p style={{ textAlign: 'center' }}>Loading your progress...</p>
          )}
        </div>
      )}

      {/* Not Logged In Prompt */}
      {!session?.user && (
        <div style={{ 
          background: '#fff3cd', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '25px',
          textAlign: 'center',
          border: '1px solid #ffc107'
        }}>
          <p style={{ margin: '0 0 10px', color: '#856404', fontWeight: 'bold' }}>
            🔐 Sign in to track your personal reading progress
          </p>
          <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
            See your stats, progress bar, and qualification status
          </p>
        </div>
      )}

      {/* Trust & Rules Banner */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '12px', 
        marginBottom: '25px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>🏆 How the Reward Program Works</h3>
        <ul style={{ color: '#666', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
          <li><strong>The Goal:</strong> Read 50 books within a 6-month cycle.</li>
          <li><strong>The Reward:</strong> A ₦5,000 Literary Grant for dedicated readers.</li>
          <li><strong>Schedule:</strong> Cycles end and rewards are distributed <strong>twice a year</strong> (June & December).</li>
          <li><strong>Verification:</strong> Books must be read for at least 5 minutes to count.</li>
        </ul>
        <p style={{fontSize:'12px', color:'#999', textAlign:'center', marginTop:'15px', marginBottom:0, fontStyle:'italic'}}>
          This is a merit-based literacy reward, not a lottery.
        </p>
      </div>

      {/* Public Leaderboard */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#666' }}>Loading reading statistics...</p>
        </div>
      ) : !data?.leaderboard || data.leaderboard.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8f9fa', borderRadius: '12px' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>📚</div>
          <h3 style={{ color: '#666', marginBottom: '10px' }}>No reading data yet</h3>
          <p style={{ color: '#999', marginBottom: '20px' }}>
            Be the first to start your 50-book journey!
          </p>
          <a href="/books" style={{ display: 'inline-block', padding: '12px 30px', background: '#667eea', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            📖 Start Reading
          </a>
        </div>
      ) : (
        <div>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>🏅 Top Readers (Current Cycle)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.leaderboard.map((entry: any) => {
              const isTop3 = entry.rank <= 3;
              const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
              
              return (
                <div 
                  key={entry.rank} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px 20px',
                    background: isTop3 ? 'linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%)' : 'white',
                    borderRadius: '12px',
                    border: isTop3 ? '2px solid #ffc107' : '1px solid #ddd',
                    boxShadow: isTop3 ? '0 4px 12px rgba(255,193,7,0.2)' : '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: isTop3 ? '28px' : '18px', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>
                      {medal}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#333', fontSize: '16px' }}>
                        {entry.name}
                      </div>
                      {entry.qualified && (
                        <span style={{ fontSize: '12px', color: '#28a745', background: '#d4edda', padding: '2px 8px', borderRadius: '10px', marginTop: '4px', display: 'inline-block' }}>
                          ✅ Qualified for Bi-Annual Grant
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
                      {entry.booksRead}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      books read
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '40px', padding: '20px', background: '#f8f9fa', borderRadius: '12px' }}>
        <p style={{ color: '#666', margin: '0 0 10px' }}>
          📚 Reading is tracked automatically when you spend 5+ minutes on a book.
        </p>
        <a href="/books" style={{ color: '#667eea', fontWeight: 'bold', textDecoration: 'none' }}>
          Browse Books →
        </a>
      </div>
    </div>
  );
}
