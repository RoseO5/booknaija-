'use client';

import { useState, useEffect } from 'react';

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats] = useState({ totalBooks: 0, pending: 0, flagged: 0, users: 0, reads: 0, authors: 0 });
  const [authors, setAuthors] = useState<any[]>([]);
  const [pendingBooks, setPendingBooks] = useState<any[]>([]);
  const [flaggedBooks, setFlaggedBooks] = useState<any[]>([]);

  useEffect(() => {
    if (!authenticated) return;
    
    fetch('/api/books/admin-list').then(r => r.json()).then(data => {
      setStats({
        totalBooks: data.total || 0,
        pending: data.pending?.length || 0,
        flagged: data.flagged?.length || 0,
        users: data.users || 0,
        reads: data.reads || 0,
        authors: data.authors || 0
      });
      setPendingBooks(data.pending || []);
      setFlaggedBooks(data.flagged || []);
    });

    if (activeTab === 'authors') {
      fetch('/api/authors/list').then(r => r.json()).then(data => setAuthors(data.authors || [])).catch(() => {});
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

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/books/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: id, status })
    });
    const res = await fetch('/api/books/admin-list');
    const data = await res.json();
    setPendingBooks(data.pending || []);
    setFlaggedBooks(data.flagged || []);
    setStats(prev => ({ ...prev, pending: data.pending?.length || 0, flagged: data.flagged?.length || 0 }));
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
      <h1 style={{ color: '#667eea', textAlign: 'center' }}>🛡️ Super Admin Dashboard</h1>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { id: 'analytics', label: '📊 Analytics', color: '#6c757d' },
          { id: 'upload', label: '📤 My Uploads', color: '#667eea' },
          { id: 'approve', label: `✅ Approve (${stats.pending})`, color: '#28a745' },
          { id: 'abuse', label: `🛡️ Abuse (${stats.flagged})`, color: '#dc3545' },
          { id: 'authors', label: `✍️ Authors (${authors.length})`, color: '#fd7e14' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
            style={{ padding: '10px 15px', background: activeTab === tab.id ? tab.color : '#f1f1f1', color: activeTab === tab.id ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ background: '#e7f3ff', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '32px', color: '#0056b3' }}>{stats.totalBooks}</h3>
              <p style={{ margin: '5px 0 0', color: '#666' }}>Total Books</p>
            </div>
            <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '32px', color: '#856404' }}>{stats.pending}</h3>
              <p style={{ margin: '5px 0 0', color: '#666' }}>Pending</p>
            </div>
            <div style={{ background: '#f8d7da', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '32px', color: '#721c24' }}>{stats.flagged}</h3>
              <p style={{ margin: '5px 0 0', color: '#666' }}>Flagged</p>
            </div>
            <div style={{ background: '#d4edda', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '32px', color: '#155724' }}>{stats.authors}</h3>
              <p style={{ margin: '5px 0 0', color: '#666' }}>Authors</p>
            </div>
          </div>
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
            <h3>📈 System Status</h3>
            <p style={{ color: '#666' }}>All systems operational. Prize pool and reading tracking active.</p>
            <a href="/leaderboard" style={{ color: '#667eea', fontWeight: 'bold' }}>View Public Leaderboard →</a>
          </div>
        </div>
      )}

      {/* UPLOAD TAB */}
      {activeTab === 'upload' && (
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>📤 Upload Your Own Book</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>As admin, your uploads go through the same approval process.</p>
          <iframe src="/upload" style={{ width: '100%', height: '450px', border: 'none', borderRadius: '8px' }} title="Admin Upload"></iframe>
        </div>
      )}

      {/* APPROVE TAB */}
      {activeTab === 'approve' && (
        <div>
          <h3>✅ Pending Approvals</h3>
          {pendingBooks.length === 0 ? <p style={{ color: '#666' }}>No pending books.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingBooks.map((b: any) => (
                <div key={b._id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <strong>{b.title}</strong> by {b.authorName}<br/>
                  <small style={{ color: '#666' }}>📅 {new Date(b.createdAt).toLocaleDateString()}</small>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => updateStatus(b._id, 'published')} style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✅ Approve</button>
                    <button onClick={() => updateStatus(b._id, 'rejected')} style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🚫 Reject</button>
                    <a href={b.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', textDecoration: 'none' }}>👁️ Preview</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABUSE DETECTION TAB */}
      {activeTab === 'abuse' && (
        <div>
          <h3>🛡️ Abuse Detection & Moderation</h3>
          <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <strong>⚠️ Auto-Detection Rules Active:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px', color: '#856404' }}>
              <li>Spam keywords: casino, betting, loan, xxx, free money, crypto scam, hack</li>
              <li>Oversized files: &gt;5MB flagged automatically</li>
              <li>User reports: 3+ reports = auto-flagged</li>
            </ul>
          </div>

          {flaggedBooks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#d4edda', borderRadius: '12px' }}>
              <p style={{ color: '#155724', fontSize: '18px', margin: 0 }}>✅ No flagged books. System is clean!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {flaggedBooks.map((b: any) => (
                <div key={b._id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #dc3545' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <strong>{b.title}</strong> by {b.authorName}<br/>
                      <small style={{ color: '#666' }}>📅 {new Date(b.createdAt).toLocaleDateString()}</small>
                    </div>
                    <span style={{ background: '#dc3545', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                      🚩 {b.reports || 0} reports
                    </span>
                  </div>
                  {b.abuseFlags && b.abuseFlags.length > 0 && (
                    <div style={{ marginTop: '8px', background: '#f8d7da', padding: '8px', borderRadius: '4px', fontSize: '13px', color: '#721c24' }}>
                      <strong>⚠️ Flags:</strong> {b.abuseFlags.join(', ')}
                    </div>
                  )}
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => updateStatus(b._id, 'published')} style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✅ Override & Approve</button>
                    <button onClick={() => updateStatus(b._id, 'rejected')} style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Delete</button>
                    <a href={b.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', textDecoration: 'none' }}>👁️ Review</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AUTHORS MANAGEMENT TAB */}
      {activeTab === 'authors' && (
        <div>
          <h3>✍️ Registered Authors</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Authors self-register via <a href="/author-onboarding" style={{ color: '#667eea' }}>/author-onboarding</a>. You can manage them here.
          </p>
          
          {authors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '12px' }}>
              <p style={{ color: '#666' }}>No authors registered yet.</p>
              <a href="/author-onboarding" style={{ color: '#667eea', fontWeight: 'bold' }}>Share onboarding link →</a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {authors.map((a: any) => (
                <div key={a._id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <strong style={{ fontSize: '16px' }}>{a.fullName}</strong><br/>
                      <small style={{ color: '#666' }}>
                        📧 {a.email} • 📱 {a.phoneNumber}<br/>
                        📍 {a.location}, {a.state}
                      </small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ background: '#d4edda', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', color: '#155724' }}>
                        ✅ Verified
                      </div>
                      <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                        📅 Joined {new Date(a.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '6px', fontSize: '13px' }}>
                    <strong>💰 Payment Details:</strong><br/>
                    {a.bankName} • {a.accountNumber} ({a.accountName})
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    📚 Books: {a.totalBooks || 0} • 👁️ Reads: {a.totalReads || 0} • 💵 Earnings: ₦{(a.earnings || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button onClick={() => setAuthenticated(false)} style={{ padding: '10px 30px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🔓 Logout</button>
      </div>
    </div>
  );
}
