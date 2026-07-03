'use client';
import { useState, useEffect } from 'react';

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');
  const [revenue, setRevenue] = useState<any>(null);
  const [readerProgress, setReaderProgress] = useState<any>(null);

  useEffect(() => {
    if (!authenticated) return;
    
    if (activeTab === 'revenue') {
      fetch('/api/revenue/calculate')
        .then(r => r.json())
        .then(data => setRevenue(data))
        .catch(() => {});
    }

    if (activeTab === 'readers') {
      fetch('/api/competition/progress')
        .then(r => r.json())
        .then(data => setReaderProgress(data))
        .catch(() => {});
    }
  }, [authenticated, activeTab]);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    const res = await fetch('/api/verify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const result = await res.json();
    if (result.valid) setAuthenticated(true);
    else { setLoginError('❌ Incorrect password'); setTimeout(() => setLoginError(''), 2000); }
  };

  const conductPrizeDraw = async () => {
    if (!confirm('Are you sure you want to conduct the prize draw?')) return;
    
    const res = await fetch('/api/competition/draw', { method: 'POST' });
    const result = await res.json();
    
    if (result.success) {
      alert(`🎉 Winners Selected!\n\n${result.winners.map((w: any) => `#${w.rank}: ${w.name} - ₦${w.prize}`).join('\n')}`);
    } else {
      alert('❌ ' + result.message);
    }
  };

  if (!authenticated) {
    return (
      <div style={{ padding: '30px', maxWidth: '400px', margin: '100px auto', fontFamily: 'Arial' }}>
        <h2 style={{ color: '#667eea', textAlign: 'center' }}>🔐 Admin Login</h2>
        {loginError && <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{loginError}</div>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="Enter admin password" required style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }} />
          <button type="submit" style={{ padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#667eea', textAlign: 'center' }}>🛡️ Admin Dashboard</h1>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => setActiveTab('revenue')} style={{ padding: '10px 15px', background: activeTab === 'revenue' ? '#28a745' : '#f1f1f1', color: activeTab === 'revenue' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>💰 Revenue</button>
        <button onClick={() => setActiveTab('readers')} style={{ padding: '10px 15px', background: activeTab === 'readers' ? '#667eea' : '#f1f1f1', color: activeTab === 'readers' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>📚 Reader Progress</button>
        <button onClick={() => setActiveTab('authors')} style={{ padding: '10px 15px', background: activeTab === 'authors' ? '#fd7e14' : '#f1f1f1', color: activeTab === 'authors' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✍️ Authors</button>
      </div>

      {/* REVENUE TAB */}
      {activeTab === 'revenue' && revenue && (
        <div>
          <h3>💰 Monthly Revenue Report</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
            <div style={{ background: '#28a745', padding: '20px', borderRadius: '12px', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '14px' }}>Total Revenue</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>₦{revenue.revenue?.estimatedMonthly?.toLocaleString()}</div>
            </div>
            <div style={{ background: '#fd7e14', padding: '20px', borderRadius: '12px', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '14px' }}>Author Pool</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>₦{revenue.revenue?.authorPool?.toLocaleString()}</div>
              <div style={{ fontSize: '12px' }}>Pay to authors</div>
            </div>
            <div style={{ background: '#667eea', padding: '20px', borderRadius: '12px', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '14px' }}>Your Profit</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>₦{revenue.revenue?.platformProfit?.toLocaleString()}</div>
              <div style={{ fontSize: '12px' }}>Keep this</div>
            </div>
            <div style={{ background: '#dc3545', padding: '20px', borderRadius: '12px', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '14px' }}>Prize Pool</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>₦{revenue.revenue?.prizePool?.toLocaleString()}</div>
              <div style={{ fontSize: '12px' }}>For readers</div>
            </div>
          </div>

          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
            <h4>📊 Platform Stats</h4>
            <p><strong>Total Readers:</strong> {revenue.summary?.totalReaders}</p>
            <p><strong>Active Subscriptions:</strong> {revenue.summary?.activeSubscriptions}</p>
            <p><strong>Total Books:</strong> {revenue.summary?.totalBooks}</p>
            <p><strong>Total Reads:</strong> {revenue.summary?.totalReads}</p>
          </div>
        </div>
      )}

      {/* READER PROGRESS TAB */}
      {activeTab === 'readers' && readerProgress && (
        <div>
          <h3>📚 Reader Progress & Prize Draw</h3>
          
          <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
            <h4>🏆 Prize Status</h4>
            <p><strong>Qualified Readers:</strong> {readerProgress.prizeDrawInfo?.qualifiedCount} (need 3+ to draw)</p>
            <p><strong>Status:</strong> {readerProgress.prizeDrawInfo?.nextDraw}</p>
            <p><strong>Method:</strong> {readerProgress.prizeDrawInfo?.drawMethod}</p>
            
            {readerProgress.prizeDrawInfo?.canDraw && (
              <button onClick={conductPrizeDraw} style={{ padding: '12px 30px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                🎉 Conduct Prize Draw Now
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px' }}>
              <h4>✅ Qualified (50+ books) - {readerProgress.categories?.qualified?.count} readers</h4>
              {readerProgress.categories?.qualified?.readers?.map((r: any, i: number) => (
                <div key={i} style={{ padding: '8px', background: 'white', borderRadius: '6px', marginBottom: '5px' }}>
                  <strong>{r.name}</strong> - {r.booksRead} books {r.status}
                </div>
              ))}
            </div>

            <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px' }}>
              <h4>🔥 Nearly Qualified (40-49 books) - {readerProgress.categories?.nearlyQualified?.count} readers</h4>
              {readerProgress.categories?.nearlyQualified?.readers?.slice(0, 5).map((r: any, i: number) => (
                <div key={i} style={{ padding: '8px', background: 'white', borderRadius: '6px', marginBottom: '5px' }}>
                  <strong>{r.name}</strong> - {r.booksRead} books ({r.progress})
                </div>
              ))}
            </div>

            <div style={{ background: '#e7f3ff', padding: '15px', borderRadius: '8px' }}>
              <h4>📈 Progressing (20-39 books) - {readerProgress.categories?.progressing?.count} readers</h4>
              {readerProgress.categories?.progressing?.readers?.slice(0, 5).map((r: any, i: number) => (
                <div key={i} style={{ padding: '8px', background: 'white', borderRadius: '6px', marginBottom: '5px' }}>
                  <strong>{r.name}</strong> - {r.booksRead} books ({r.progress})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AUTHORS TAB */}
      {activeTab === 'authors' && (
        <div>
          <h3>✍️ Authors & Payouts</h3>
          <p>Authors can view their earnings at: <a href="/author-dashboard" style={{ color: '#667eea' }}>/author-dashboard</a></p>
          <p style={{ color: '#666' }}>Share this link with your authors so they can track their earnings.</p>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button onClick={() => setAuthenticated(false)} style={{ padding: '10px 30px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🔓 Logout</button>
      </div>
    </div>
  );
}
