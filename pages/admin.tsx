'use client';

import { useState, useEffect } from 'react';

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('approve');
  const [books, setBooks] = useState({ pending: [], flagged: [], total: 0 });

  useEffect(() => {
    if (!authenticated) return;
    fetch('/api/books/admin-list').then(r => r.json()).then(setBooks);
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
    // Refresh list
    const res = await fetch('/api/books/admin-list');
    setBooks(await res.json());
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

  const list = activeTab === 'approve' ? books.pending : activeTab === 'reject' ? books.flagged : [];

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#667eea', textAlign: 'center' }}>🛡️ Admin Moderation</h1>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('approve')} style={{ padding: '10px', background: activeTab === 'approve' ? '#667eea' : '#f1f1f1', color: activeTab === 'approve' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✅ Approve ({books.pending.length})</button>
        <button onClick={() => setActiveTab('reject')} style={{ padding: '10px', background: activeTab === 'reject' ? '#dc3545' : '#f1f1f1', color: activeTab === 'reject' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🚫 Reject Spam ({books.flagged.length})</button>
        <button onClick={() => setActiveTab('monitor')} style={{ padding: '10px', background: activeTab === 'monitor' ? '#6c757d' : '#f1f1f1', color: activeTab === 'monitor' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📊 Monitor ({books.total})</button>
      </div>

      {activeTab === 'monitor' ? (
        <div style={{ background: '#e7f3ff', padding: '15px', borderRadius: '8px' }}>
          <h3>📊 Live Stats</h3>
          <p>Total Books: <strong>{books.total}</strong></p>
          <p>Pending Approval: <strong>{books.pending.length}</strong></p>
          <p>Flagged/Spam: <strong>{books.flagged.length}</strong></p>
        </div>
      ) : list.length === 0 ? (
        <p style={{ color: '#666' }}>No books in this category.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {list.map((b: any) => (
            <div key={b._id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <strong>{b.title}</strong> by {b.authorName}<br/>
              <span style={{ fontSize: '12px', color: '#666' }}>📁 {b.pdfUrl?.split('/').pop()} • 🚩 {b.reports || 0} reports • ⚠️ {(b.abuseFlags || []).join(', ') || 'None'}</span>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <button onClick={() => updateStatus(b._id, 'published')} style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✅ Approve</button>
                <button onClick={() => updateStatus(b._id, 'rejected')} style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🚫 Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button onClick={() => setAuthenticated(false)} style={{ padding: '10px 30px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🔓 Logout</button>
      </div>
    </div>
  );
}
