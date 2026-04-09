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
    if (!pdfFile || !(pdfFile as File).name) {
      setError('❌ Please select a PDF file');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const res = await fetch('/api/books/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        setSuccess('✅ Upload successful!');
        setTimeout(() => (window.location.href = '/books'), 2000);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err: any) {
      setError('❌ Network error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Upload Book</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input name="title" placeholder="Title" required />
        <input name="authorName" placeholder="Author" required />
        <textarea name="description" placeholder="Description" />

        <input name="pages" type="number" placeholder="Pages" />

        <input name="pdf" type="file" accept="application/pdf" required />

        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  );
}
