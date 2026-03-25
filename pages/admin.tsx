'use client';

export default function Admin() {
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // Create FormData (includes files automatically)
    const formData = new FormData(e.currentTarget);
    
    // Show loading state
    const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '📤 Uploading... (May take 10-30s)';

    try {
      // Upload to API (multipart/form-data)
      const res = await fetch('/api/books/upload', {
        method: 'POST',
        body: formData // ⚠️ DO NOT set Content-Type header (browser sets boundary)
      });

      const result = await res.json();
      
      if (result.success) {
        alert(`✅ SUCCESS!\n\nBook: ${result.book.title}\nSize: ${result.book.size}\n\nPDF URL: ${result.book.pdfUrl}\n\nBook added to library!`);
        window.location.href = '/books';
      } else {
        alert(`❌ Upload failed:\n${result.error}\n\nFix: ${result.fix}`);
      }
    } catch (error) {
      alert('❌ Network error. Check internet connection and try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '30px 20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', background: 'white', borderRadius: '15px', padding: '40px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' }}>
        <h1 style={{ textAlign: 'center', color: '#667eea', marginBottom: '10px' }}>➕ Upload Book</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Add your book to BookNaija library</p>
        
        <div style={{ background: '#d4edda', padding: '15px', borderRadius: '10px', marginBottom: '25px', borderLeft: '4px solid #28a745' }}>
          <strong>✅ REAL STORAGE:</strong> PDFs stored on Vercel Blob • Metadata in MongoDB
        </div>

        <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Book Title *</label>
            <input name="title" type="text" required placeholder="e.g., Lagos Dreams" style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Author Name *</label>
            <input name="authorName" type="text" required placeholder="e.g., Ada Nwosu" style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Description</label>
            <textarea name="description" rows={4} placeholder="Brief description of your book..." style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px', resize: 'vertical' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Category</label>
            <select name="category" style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }}>
              <option>Fiction</option>
              <option>Romance</option>
              <option>Thriller</option>
              <option>Historical</option>
              <option>Drama</option>
              <option>Poetry</option>
              <option>Non-Fiction</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Number of Pages</label>
            <input name="pages" type="number" placeholder="e.g., 142" style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }} />
          </div>

          {/* PDF UPLOAD */}
          <div style={{ border: '2px dashed #4ade80', borderRadius: '8px', padding: '25px', textAlign: 'center', background: '#f0fdf4' }}>
            <p style={{ margin: '0 0 15px 0', color: '#166534', fontWeight: 'bold', fontSize: '1.1rem' }}>📄 Upload PDF File *</p>
            <input 
              name="pdf" 
              type="file" 
              accept=".pdf"
              required
              style={{ display: 'block', margin: '0 auto 10px auto', fontSize: '16px' }}
            />
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#166534' }}>✅ Max 15MB • Vercel Blob storage • Fast CDN delivery</p>
          </div>

          {/* COVER UPLOAD */}
          <div style={{ border: '2px dashed #3b82f6', borderRadius: '8px', padding: '25px', textAlign: 'center', background: '#eff6ff' }}>
            <p style={{ margin: '0 0 15px 0', color: '#1e40af', fontWeight: 'bold', fontSize: '1.1rem' }}>🖼️ Upload Cover Image (Optional)</p>
            <input 
              name="cover" 
              type="file" 
              accept="image/*"
              style={{ display: 'block', margin: '0 auto 10px auto', fontSize: '16px' }}
            />
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e40af' }}>✅ Recommended: 400x600px • JPG/PNG • Under 5MB</p>
          </div>

          <button 
            type="submit"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: 'white', 
              padding: '16px', 
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            📤 Upload Book to Vercel Blob + MongoDB
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            <strong>💡 How it works:</strong><br/>
            PDF → Vercel Blob (storage) • URL → MongoDB (metadata)<br/>
            Readers download directly from Vercel's CDN (fast in Nigeria!)
          </p>
          <a href="/" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
