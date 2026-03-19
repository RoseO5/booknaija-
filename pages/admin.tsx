export default function Admin() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      padding: '30px 20px'
    }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', background: 'white', borderRadius: '15px', padding: '40px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' }}>
        <h1 style={{ textAlign: 'center', color: '#667eea', marginBottom: '10px' }}>➕ Upload Book</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Add your book to BookNaija library</p>
        
        <div style={{ background: '#d4edda', padding: '15px', borderRadius: '10px', marginBottom: '25px', borderLeft: '4px solid #28a745' }}>
          <strong>✅ TEST MODE:</strong> Books are saved to mock database. Real MongoDB integration coming soon.
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          alert('✅ Book uploaded successfully! (Test mode)\n\nIn Phase 2, this will save to MongoDB + Vercel Blob storage.');
          window.location.href = '/books';
        }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Book Title *</label>
            <input 
              type="text" 
              required
              placeholder="e.g., Lagos Dreams"
              style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Author Name *</label>
            <input 
              type="text" 
              required
              placeholder="e.g., Ada Nwosu"
              style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Description</label>
            <textarea 
              rows={4}
              placeholder="Brief description of your book..."
              style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Category</label>
            <select style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }}>
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
            <input 
              type="number" 
              placeholder="e.g., 142"
              style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
            />
          </div>

          <div style={{ border: '2px dashed #ddd', borderRadius: '8px', padding: '30px', textAlign: 'center', background: '#fafafa' }}>
            <p style={{ margin: '0 0 15px 0', color: '#666' }}>📄 Upload PDF File *</p>
            <input 
              type="file" 
              accept=".pdf"
              required
              style={{ display: 'block', margin: '0 auto 15px auto' }}
            />
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#999' }}>Max size: 10MB (in Phase 2)</p>
          </div>

          <div style={{ border: '2px dashed #ddd', borderRadius: '8px', padding: '30px', textAlign: 'center', background: '#fafafa' }}>
            <p style={{ margin: '0 0 15px 0', color: '#666' }}>🖼️ Upload Cover Image (Optional)</p>
            <input 
              type="file" 
              accept="image/*"
              style={{ display: 'block', margin: '0 auto 15px auto' }}
            />
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#999' }}>Recommended: 400x600px</p>
          </div>

          <button 
            type="submit"
            style={{ 
              background: '#667eea', 
              color: 'white', 
              padding: '15px', 
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            📤 Upload Book
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <a href="/" style={{ color: '#667eea', textDecoration: 'none' }}>← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
