'use client';

import { useState, useEffect } from 'react';

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats] = useState({ totalBooks: 0, pending: 0, flagged: 0, users: 0, reads: 0 });
  const [authors, setAuthors] = useState([]);
  const [pendingBooks, setPendingBooks] = useState([]);
  const [flaggedBooks, setFlaggedBooks] = useState([]);

  // Fetch data when tab changes
  useEffect(() => {
    if (!authenticated) return;
    
    // Fetch Stats
    fetch('/api/books/admin-list').then(r => r.json()).then(data => {
      setStats({
        totalBooks: data.total || 0,
        pending: data.pending?.length || 0,
        flagged: data.flagged?.length || 0,
        users: 0, // Placeholder for now
        reads: 0  // Placeholder for now
      });
      setPendingBooks(data.pending || []);
      setFlaggedBooks(data.flagged || []);
    });

    // Fetch Authors (if tab is authors)
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
    // Refresh lists
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
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#667eea', textAlign: 'center' }}>🛡️ Super Admin Dashboard</h1>
      
      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { id: 'analytics', label: '📊 Analytics', color: '#6c757d' },
          { id: 'upload', label: '📤 My Uploads', color: '#667eea' },
          { id: 'approve', label: `✅ Approve (${stats.pending})`, color: '#28a745' },
          { id: 'reject', label: `🚫 Reject (${stats.flagged})`, color: '#dc3545' },
          { id: 'authors', label: '✍️ Authors', color: '#fd7e14' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
            style={{ padding: '10px 15px', background: activeTab === tab.id ? tab.color : '#f1f1f1', color: activeTab === tab.id ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          <div style={{ background: '#e7f3ff', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '32px', color: '#0056b3' }}>{stats.totalBooks}</h3>
            <p style={{ margin: '5px 0 0', color: '#666' }}>Total Books</p>
          </div>
          <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '32px', color: '#856404' }}>{stats.pending}</h3>
            <p style={{ margin: '5px 0 0', color: '#666' }}>Pending Approval</p>
          </div>
          <div style={{ background: '#f8d7da', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '32px', color: '#721c24' }}>{stats.flagged}</h3>
            <p style={{ margin: '5px 0 0', color: '#666' }}>Flagged/Spam</p>
          </div>
          <div style={{ background: '#d4edda', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '32px', color: '#155724' }}>{stats.users}</h3>
            <p style={{ margin: '5px 0 0', color: '#666' }}>Active Readers</p>
          </div>
        </div>
      )}

      {/* UPLOAD TAB (For Admin Only) */}
      {activeTab === 'upload' && (
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>📤 Upload Your Own Book</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>As an admin, your uploads are auto-approved.</p>
          <iframe src="/upload" style={{ width: '100%', height: '400px', border: 'none' }} title="Admin Upload"></iframe>
        </div>
      )}

      {/* APPROVE TAB */}
      {activeTab === 'approve' && (
        <div>
          <h3>✅ Pending Approvals</h3>
          {pendingBooks.length === 0 ? <p>No pending books.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingBooks.map((b: any) => (
                <div key={b._id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <strong>{b.title}</strong> by {b.authorName}<br/>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => updateStatus(b._id, 'published')} style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✅ Approve</button>
                    <button onClick={() => updateStatus(b._id, 'rejected')} style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🚫 Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REJECT TAB */}
      {activeTab === 'reject' && (
        <div>
          <h3>🚫 Flagged/Spam</h3>
          {flaggedBooks.length === 0 ? <p>No flagged books.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {flaggedBooks.map((b: any) => (
                <div key={b._id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <strong>{b.title}</strong> by {b.authorName}<br/>
                  <span style={{ fontSize: '12px', color: '#dc3545' }}>⚠️ {(b.abuseFlags || []).join(', ')}</span>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => updateStatus(b._id, 'published')} style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✅ Approve</button>
                    <button onClick={() => updateStatus(b._id, 'rejected')} style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AUTHORS ONBOARDING TAB */}
      {activeTab === 'authors' && (
        <div>
          <h3>✍️ Author Onboarding & Management</h3>
          <p style={{ color: '#666' }}>Manage author details, bank info, and compliance.</p>
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h4>Add New Author</h4>
            <form onSubmit={(e) => { e.preventDefault(); alert('Author onboarding form would go here!'); }}>
              <input placeholder="Full Name" style={{ width: '100%', padding: '8px', margin: '5px 0' }} />
              <input placeholder="Location (State/City)" style={{ width: '100%', padding: '8px', margin: '5px 0' }} />
              <input placeholder="Bank Name" style={{ width: '100%', padding: '8px', margin: '5px 0' }} />
              <input placeholder="Account Number" style={{ width: '100%', padding: '8px', margin: '5px 0' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: '10px 0' }}>
                <input type="checkbox" required /> I agree to the Compliance & Terms
              </label>
              <button type="submit" style={{ padding: '10px 20px', background: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Onboard Author</button>
            </form>
          </div>
          <h4>Registered Authors</h4>
          {authors.length === 0 ? <p>No authors onboarded yet.</p> : (
            <ul>{authors.map((a: any) => <li key={a._id}>{a.name} - {a.location}</li>)}</ul>
          )}
        </div>
      )}

      {/* Logout */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button onClick={() => setAuthenticated(false)} style={{ padding: '10px 30px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🔓 Logout</button>
      </div>
    </div>
  );
}
