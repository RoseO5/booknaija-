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
        setSuccess(`✅ SUCCESS!\n\nBook: ${result.book.title}\nSize: ${result.book.size}\n\nRedirecting to books page...`);
        setTimeout(() => {
          window.location.href = '/books';
        }, 2500);
      } else {
        setError(`❌ UPLOAD FAILED\n\n${result.error || result.message}\n\n💡 ${result.fix || 'Try again with smaller PDF or better signal'}`);
      }
    } catch (err) {
      setError(`❌ NETWORK ERROR\n\n${err.message}\n\n💡 Try:\n- Check mobile data/WiFi\n- Use smaller PDF (< 300KB)\n- Wait 1 minute and retry\n- Move to area with better signal`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' }}>
        <h1 style={{ textAlign: 'center', color: '#667eea', marginBottom: '20px', fontSize: '28px' }}>➕ Upload Book</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '25px', fontSize: '16px' }}>Add your book to BookNaija library</p>
        
        {/* ERROR MESSAGE */}
        {error && (
          <div style={{ background: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '8px', marginBottom: '20px', whiteSpace: 'pre-line', borderLeft: '4px solid #dc3545' }}>
            {error}
          </div>
        )}
        
        {/* SUCCESS MESSAGE */}
        {success && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '15px', borderRadius: '8px', marginBottom: '20px', whiteSpace: 'pre-line', borderLeft: '4px solid #28a745' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Book Title *</label>
            <input 
              name="title" 
              type="text" 
              defaultValue="Test Book" 
              required 
              style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Author Name *</label>
            <input 
              name="authorName" 
              type="text" 
              defaultValue="Test Author" 
              required 
              style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }} 
            />
          </div>

          <div style={{ border: '2px dashed #4ade80', borderRadius: '8px', padding: '25px', textAlign: 'center', background: '#f0fdf4' }}>
            <p style={{ margin: '0 0 15px 0', color: '#166534', fontWeight: 'bold', fontSize: '18px' }}>📄 Upload PDF File *</p>
            <input 
              name="pdf" 
              type="file" 
              accept=".pdf" 
              required 
              style={{ display: 'block', margin: '0 auto 10px auto', fontSize: '16px' }} 
            />
            <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>✅ Perfect for mobile data: Keep under 300KB</p>
          </div>

          <button 
            type="submit" 
            disabled={uploading}
            style={{ 
              background: uploading ? '#999' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white', 
              padding: '16px', 
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: uploading ? 'not-allowed' : 'pointer',
              boxShadow: uploading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            {uploading ? '📤 Uploading... (10-30 seconds)' : '📤 Upload Book'}
          </button>
        </form>

        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee', fontSize: '14px', color: '#666' }}>
          <p style={{ marginBottom: '15px' }}>
            <strong>💡 Mobile Data Tips:</strong><br/>
            • Use PDF under 300KB<br/>
            • Wait for strong signal (4+ bars)<br/>
            • Don't close browser during upload<br/>
            • If fails, wait 1 minute before retry
          </p>
          <a href="/" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 'bold', display: 'block', textAlign: 'center' }}>← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
