'use client';

import { useState } from 'react';

export default function Admin() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Validate PDF selected
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

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await res.json();
        if (result.success) {
          setSuccess(`✅ SUCCESS!\n\nBook: ${result.book.title}\nSize: ${result.book.size}`);
          setTimeout(() => window.location.href = '/books', 2500);
        } else {
          setError(`❌ UPLOAD FAILED\n\n${result.error || result.details || 'Unknown error'}`);
        }
      } else {
        const text = await res.text();
        setError(`❌ SERVER ERROR\n\nStatus: ${res.status}\n\n${text.substring(0, 200)}`);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      if (err.name === 'AbortError') {
        setError('❌ Upload cancelled or timed out. Please try again with better signal.');
      } else if (err.message?.includes('fetch')) {
        setError('❌ NETWORK ERROR\n\nYour connection is too weak.\n\n💡 Try:\n- Wait for 3+ signal bars\n- Use smaller PDF (< 100KB)\n- Don\'t close browser during upload');
      } else {
        setError(`❌ ERROR: ${err.message || 'Upload failed. Check Vercel logs.'}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#667eea', textAlign: 'center', fontSize: '28px' }}>➕ Upload Book</h1>
      
      {error && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '8px', marginBottom: '20px', whiteSpace: 'pre-line', borderLeft: '4px solid #dc3545' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ background: '#d4edda', color: '#155724', padding: '15px', borderRadius: '8px', marginBottom: '20px', whiteSpace: 'pre-line', borderLeft: '4px solid #28a745' }}>
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '16px' }}>Book Title *</label>
          <input 
            name="title" 
            type="text" 
            defaultValue="My Book" 
            required 
            style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }} 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '16px' }}>Author Name *</label>
          <input 
            name="authorName" 
            type="text" 
            defaultValue="Author Name" 
            required 
            style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }} 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '16px' }}>Description</label>
          <textarea 
            name="description" 
            rows="4" 
            defaultValue="A brief description of your book"
            style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px', resize: 'vertical' }} 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '16px' }}>Number of Pages</label>
          <input 
            name="pages" 
            type="number" 
            defaultValue="100" 
            min="1"
            style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize
