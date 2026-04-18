'use client';

import { useState } from 'react';

export default function Admin() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setUploading(true);
    setMessage('');

    try {
      const res = await fetch('/api/books/upload', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      setMessage(result.success ? '✅ SUCCESS!' : '❌ ' + result.error);
      if (result.success) setTimeout(() => window.location.href = '/books', 2000);
    } catch (err) {
      setMessage('❌ Network error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>➕ Upload Book</h1>
      {message && <div style={{ margin: '10px 0', padding: '10px', background: message.includes('✅') ? '#d4edda' : '#f8d7da' }}>{message}</div>}
      
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input name="title" placeholder="Title" required style={{ width: '100%', margin: '5px 0', padding: '8px' }} />
        <input name="authorName" placeholder="Author" required style={{ width: '100%', margin: '5px 0', padding: '8px' }} />
        <input name="pdf" type="file" accept=".pdf" required style={{ width: '100%', margin: '5px 0', padding: '8px' }} />
        <button type="submit" disabled={uploading} style={{ width: '100%', padding: '10px', background: '#667eea', color: 'white' }}>
          {uploading ? '📤 Uploading...' : '📤 Upload'}
        </button>
      </form>
    </div>
  );
}
