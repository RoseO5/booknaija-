'use client';

import { useState } from 'react';

export default function Upload() {
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
        setTimeout(() => window.location.href = '/books', 2000);
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
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#667eea', textAlign: 'center' }}>📤 Upload Your Book</h1>
      
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
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', padding: '10px', background: '#fff3cd', borderRadius: '4px' }}>
        <strong>💡 Tips:</strong><br/>
        • PDF under 100KB uploads fastest<br/>
        • Wait for 3+ signal bars<br/>
        • Keep screen on during upload
      </div>
    </div>
  );
}
