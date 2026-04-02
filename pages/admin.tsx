'use client';

import { useState } from 'react';

export default function Admin() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const res = await fetch('/api/books/upload', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      if (result.success) {
        setSuccess('✅ Book uploaded! Redirecting...');
        setTimeout(() => window.location.href = '/books', 2000);
      } else {
        setError('❌ ' + (result.error || 'Upload failed. Try smaller PDF or better signal.'));
      }
    } catch (err: any) {
      setError('❌ Network error: ' + (err.message || 'Check connection and retry'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#667eea', textAlign: 'center' }}>➕ Upload Book (200KB)</h1>
      
      {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '6px', marginBottom: '15px' }}>{error}</div>}
      {success && <div style={{ background: '#d4edda', color: '#155724', padding: '12px', borderRadius: '6px', marginBottom: '15px' }}>{success}</div>}
      
      <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Title *</label>
          <input name="title" defaultValue="Test Book" required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Author *</label>
          <input name="authorName" defaultValue="Test Author" required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
        </div>
        
        <div style={{ marginBottom: '20px', border: '2px dashed #4ade80', padding: '15px', borderRadius: '8px', background: '#f0fdf4' }}>
          <label style={{ display: 'block', fontWeight: 'bold', color: '#166534' }}>📄 PDF File (200KB) *</label>
          <input name="pdf" type="file" accept=".pdf" required style={{ width: '100%', marginTop: '8px' }} />
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#166534' }}>✅ Perfect for mobile data! Keep under 300KB</p>
        </div>
        
        <button 
          type="submit" 
          disabled={uploading}
          style={{ 
            width: '100%', 
            background: uploading ? '#999' : '#667eea', 
            color: 'white', 
            padding: '14px', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '18px', 
            fontWeight: 'bold',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? '📤 Uploading... (10-30s)' : '📤 Upload Book'}
        </button>
      </form>
      
      <div style={{ marginTop: '25px', padding: '15px', background: '#e7f3ff', borderRadius: '10px', fontSize: '14px' }}>
        <strong>💡 Mobile Tips:</strong><br/>
        • Use PDF under 300KB<br/>
        • Wait for 4+ signal bars<br/>
        • Don't close browser during upload<br/>
        • If fails: wait 60s → retry
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <a href="/" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 'bold' }}>← Home</a>
      </div>
    </div>
  );
}
