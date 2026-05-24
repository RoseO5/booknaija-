'use client';

import { useState, useEffect } from 'react';

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const [books, setBooks] = useState({ pending: [], flagged: [], total: 0 });
  const [loading, setLoading] = useState(false);

  // Fetch books when authenticated + tab changes
  useEffect(() => {
    if (!authenticated || (activeTab !== 'approve' && activeTab !== 'reject' && activeTab !== 'monitor')) return;
    setLoading(true);
    fetch('/api/books/admin-list')
      .then(r => r.json())
      .then(data => setBooks({
        pending: Array.isArray(data.pending) ? data.pending : [],
        flagged: Array.isArray(data.flagged) ? data.flagged : [],
        total: data.total || 0
      }))
      .catch(() => setBooks({ pending: [], flagged: [], total: 0 }))
      .finally(() => setLoading(false));
  }, [authenticated, activeTab]);

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
      setActiveTab('upload'); // Start with upload tab
    } else {
      setLoginError('❌ Incorrect password');
      setTimeout(() => setLoginError(''), 2000);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/books/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: id, status })
      });
      // Refresh list
      const res = await fetch('/api/books/admin-list');
      const data = await res.json();
      setBooks({
        pending: Array.isArray(data.pending) ? data.pending : [],
        flagged: Array.isArray(data.flagged) ? data.flagged : [],
        total: data.total || 0
      });
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Login screen
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
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#667eea', textAlign: 'center' }}>🛡️ Admin Dashboard</h1>
      
      {/* Tabs: Upload + 3 moderation functions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('upload')} style={{ padding: '10px 15px', background: activeTab === 'upload' ? '#667eea' : '#f1f1f1', color: activeTab === 'upload' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>📤 Upload</button>
        <button onClick={() => setActiveTab('approve')} style={{ padding: '10px 15px', background: activeTab === 'approve' ? '#28a745' : '#f1f1f1', color: activeTab === 'approve' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>✅ Approve ({books.pending?.length || 0})</button>
        <button onClick={() => setActiveTab('reject')} style={{ padding: '10px 15px', background: activeTab === 'reject' ? '#dc3545' : '#f1f1f1', color: activeTab === 'reject' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>🚫 Reject ({books.flagged?.length || 0})</button>
        <button onClick={() => setActiveTab('monitor')} style={{ padding: '10px 15px', background: activeTab === 'monitor' ? '#6c757d' : '#f1f1f1', color: activeTab === 'monitor' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>📊 Monitor ({books.total || 0})</button>
      </div>

      {/* UPLOAD TAB - You can upload your own books here */}
      {activeTab === 'upload' && (
        <UploadForm onUploaded={() => { setActiveTab('approve'); }} />
      )}

      {/* APPROVE TAB */}
      {activeTab === 'approve' && (
        <div>
          <h3>✅ Pending Approvals</h3>
          {loading ? <p>Loading...</p> : books.pending?.length === 0 ? (
            <p style={{ color: '#666' }}>No books pending approval.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {books.pending.map((b: any) => (
                <div key={b._id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <strong>{b.title}</strong> by {b.authorName}<br/>
                  <span style={{ fontSize: '12px', color: '#666' }}>🚩 {b.reports || 0} reports</span>
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
          {loading ? <p>Loading...</p> : books.flagged?.length === 0 ? (
            <p style={{ color: '#666' }}>No flagged books.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {books.flagged.map((b: any) => (
                <div key={b._id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <strong>{b.title}</strong> by {b.authorName}<br/>
                  <span style={{ fontSize: '12px', color: '#666' }}>⚠️ {(b.abuseFlags || []).join(', ') || 'User reports'}</span>
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

      {/* MONITOR TAB */}
      {activeTab === 'monitor' && (
        <div style={{ background: '#e7f3ff', padding: '15px', borderRadius: '8px' }}>
          <h3>📊 Live Stats</h3>
          <p>Total Books: <strong>{books.total || 0}</strong></p>
          <p>Pending Approval: <strong>{books.pending?.length || 0}</strong></p>
          <p>Flagged/Spam: <strong>{books.flagged?.length || 0}</strong></p>
          <p style={{ marginTop: '10px', fontSize: '14px' }}>💡 Auto-detection: Spam keywords, oversized files, 3+ user reports</p>
        </div>
      )}

      {/* Logout */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button onClick={() => setAuthenticated(false)} style={{ padding: '10px 30px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🔓 Logout</button>
      </div>
    </div>
  );
}

// Reusable Upload Form Component (for admin to upload their own books)
function UploadForm({ onUploaded }: { onUploaded: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pdfFile = formData.get('pdf') as File | null;
    
    if (!pdfFile || !pdfFile.name) {
      setMessage('❌ Please select a PDF file');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const res = await fetch('/api/books/upload', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      
      if (result.success) {
        setMessage('✅ Book uploaded successfully!');
        setTimeout(() => {
          setMessage('');
          onUploaded(); // Refresh admin list
        }, 2000);
      } else {
        setMessage('❌ ' + (result.error || 'Upload failed'));
      }
    } catch (err: any) {
      setMessage('❌ Network error. Check connection and retry.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: 0 }}>📤 Upload Your Book</h3>
      {message && (
        <div style={{ 
          margin: '10px 0', 
          padding: '12px', 
          background: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input name="title" placeholder="Book Title *" required style={{ width: '100%', margin: '8px 0', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
        <input name="authorName" placeholder="Author Name *" required style={{ width: '100%', margin: '8px 0', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
        <input name="pdf" type="file" accept=".pdf" required style={{ width: '100%', margin: '8px 0', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
        <button type="submit" disabled={uploading} style={{ width: '100%', padding: '12px', background: uploading ? '#999' : '#667eea', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer' }}>
          {uploading ? '📤 Uploading...' : '📤 Upload Book'}
        </button>
      </form>
      <p style={{ marginTop: '15px', fontSize: '13px', color: '#666' }}>💡 Tip: PDF under 100KB uploads fastest on mobile</p>
    </div>
  );
}
