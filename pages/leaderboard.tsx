'use client';
import { useEffect, useState } from 'react';

export default function Leaderboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/competition/leaderboard')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#667eea', fontSize: '32px', marginBottom: '10px' }}>🏆 Reading Status</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Top readers competing for the ₦5,000 prize
        </p>
      </div>

      {/* Prize Info */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        padding: '25px', 
        borderRadius: '12px', 
        marginBottom: '25px',
        color: 'white',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 10px', fontSize: '24px' }}>🎯 Reader Competition</h2>
        <p style={{ margin: '0 0 15px', fontSize: '16px' }}>
          Read <strong>50 books in 6 months</strong> to qualify
        </p>
        <div style={{ 
          background: 'rgba(255,255,255,0.2)', 
          padding: '15px', 
          borderRadius: '8px',
          display: 'inline-block'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Prize Pool</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>₦5,000</div>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '12px', 
        marginBottom: '25px' 
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>📖 How It Works</h3>
        <ul style={{ color: '#666', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
          <li>Subscribe for ₦1000/month to access all books</li>
          <li>Read a book for at least 5 minutes</li>
          <li>Click "Mark as Read" to count it</li>
          <li>Read 50 books in 6 months to win ₦5,000</li>
        </ul>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#666' }}>Loading leaderboard...</p>
        </div>
      ) : !data?.leaderboard || data.leaderboard.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          background: '#f8f9fa', 
          borderRadius: '12px' 
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>📚</div>
          <h3 style={{ color: '#666', marginBottom: '10px' }}>No readers yet</h3>
          <p style={{ color: '#999', marginBottom: '20px' }}>
            Be the first to start reading and claim the prize!
          </p>
          <a href="/books" style={{ 
            display: 'inline-block', 
            padding: '12px 30px', 
            background: '#667eea', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '8px', 
            fontWeight: 'bold' 
          }}>
            📖 Start Reading
          </a>
        </div>
      ) : (
        <div>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>🏅 Top Readers</h3>
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
                    <div style={{ 
                      fontSize: isTop3 ? '28px' : '18px', 
                      fontWeight: 'bold',
                      minWidth: '40px',
                      textAlign: 'center'
                    }}>
                      {medal}
                    </div>
                    <div>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: '#333',
                        fontSize: '16px'
                      }}>
                        {entry.name}
                      </div>
                      {entry.qualified && (
                        <span style={{ 
                          fontSize: '12px', 
                          color: '#28a745',
                          background: '#d4edda',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          marginTop: '4px',
                          display: 'inline-block'
                        }}>
                          ✅ Qualified for Prize
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ 
                    textAlign: 'right'
                  }}>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#667eea' 
                    }}>
                      {entry.booksRead}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666' 
                    }}>
                      books read
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '40px', 
        padding: '20px',
        background: '#f8f9fa',
        borderRadius: '12px'
      }}>
        <p style={{ color: '#666', margin: '0 0 10px' }}>
          📚 Reading is tracked automatically when you spend 5+ minutes on a book
        </p>
        <a href="/books" style={{ color: '#667eea', fontWeight: 'bold', textDecoration: 'none' }}>
          Browse Books →
        </a>
      </div>
    </div>
  );
}
