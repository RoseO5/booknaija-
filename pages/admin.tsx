'use client';

import { useState } from 'react';

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('approve');

  // Login screen
  if (!authenticated) {
    const handleLogin = async (e: any) => {
      e.preventDefault();
      const res = await fetch('/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await res.json();
      if (result.valid) {
        setAuthenticated(true);
      } else {
        setLoginError('❌ Incorrect password');
        setTimeout(() => setLoginError(''), 2000);
      }
    };
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

  // Admin dashboard with 3 functions only
  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#667eea', textAlign: 'center' }}>🛡️ Admin Dashboard</h1>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('approve')} style={{ padding: '10px 20px', background: activeTab === 'approve' ? '#667eea' : '#f1f1f1', color: activeTab === 'approve' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✅ Approve Books</button>
        <button onClick={() => setActiveTab('reject')} style={{ padding: '10px 20px', background: activeTab === 'reject' ? '#dc3545' : '#f1f1f1', color: activeTab === 'reject' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🚫 Reject Spam</button>
        <button onClick={() => setActiveTab('monitor')} style={{ padding: '10px 20px', background: activeTab === 'monitor' ? '#6c757d' : '#f1f1f1', color: activeTab === 'monitor' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>📊 Monitor Abuse</button>
      </div>

      {/* Tab Content */}
      {activeTab === 'approve' && (
        <div>
          <h3>✅ Pending Approvals</h3>
          <p style={{ color: '#666' }}>No books pending approval. All uploads are auto-approved for now.</p>
          <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
            <strong>💡 Tip:</strong> In Phase 3, add a "pending" status to books and list them here for manual review.
          </div>
        </div>
      )}

      {activeTab === 'reject' && (
        <div>
          <h3>🚫 Reject Spam</h3>
          <p style={{ color: '#666' }}>No spam reports yet.</p>
          <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
            <strong>💡 Tip:</strong> Add a "Report" button on book pages. Reports appear here for you to review and delete.
          </div>
        </div>
      )}

      {activeTab === 'monitor' && (
        <div>
          <h3>📊 Monitor Abuse</h3>
          <div style={{ background: '#e7f3ff', padding: '15px', borderRadius: '8px' }}>
            <strong>📈 Stats:</strong><br/>
            • Total books: <strong>0</strong><br/>
            • Total users: <strong>1</strong> (you)<br/>
            • Reports: <strong>0</strong><br/>
            • Uploads today: <strong>0</strong>
          </div>
          <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
            <strong>⚠️ Alert:</strong> No abuse detected. Monitor will auto-flag if:
            <ul style={{ marginTop: '8px' }}>
              <li>Same IP uploads >10 books/hour</li>
              <li>Book title contains spam keywords</li>
              <li>PDF size >50MB (unusual)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Logout */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button onClick={() => setAuthenticated(false)} style={{ padding: '10px 30px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🔓 Logout</button>
      </div>
    </div>
  );
}
