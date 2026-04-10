'use client';

import { useState } from 'react';

export default function Admin() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pdfFile = formData.get('pdf');
    
    if (!pdfFile || !(pdfFile instanceof File)) {
      setError('❌ Please select a PDF file before uploading');
      return;
    }

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
        setSuccess('✅ Book uploaded successfully!');
        setTimeout(() => window.location.href = '/books', 2000);
      } else {
        setError('❌ ' + (result.error || 'Upload failed. Try again.'));
      }
    } catch (err: any) {
      setError('❌ Network error. Check your connection and retry.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#667eea', textAlign: 'center', fontSize: '28px' }}>➕ Upload Book</h1>
      
      {error && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ background: '#d4edda', color: '#155724', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' }}>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Book Title *</label>
          <input name="title" type="text" defaultValue="My Book" required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Author Name *</label>
          <input name="authorName" type="text" defaultValue="Author Name" required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Description</label>
          <textarea 
            name="description" 
            rows={4} 
            defaultValue="A brief description of your book"
            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Pages</label>
          <input 
            name="pages" 
            type="number" 
            defaultValue="100"
            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Upload PDF *</label>
          <input 
            name="pdf" 
            type="file" 
            accept=".pdf"
            required
            style={{ width: '100%' }} 
          />
        </div>

        <button 
          type="submit" 
          disabled={uploading}
          style={{ width: '100%', padding: '14px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
        >
          {uploading ? 'Uploading...' : 'Upload Book'}
        </button>

      </form>
    </div>
  );
}
