export default function Home() {
  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ color: '#667eea', fontSize: '32px', marginBottom: '10px' }}>📚 BookNaija</h1>
        <p style={{ color: '#666', fontSize: '18px', lineHeight: '1.5' }}>
          Discover and share Nigerian stories.<br/>
          <span style={{ fontSize: '16px', color: '#999' }}>Built for Nigerian readers & authors</span>
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
        <a href="/books" style={{ display: 'block', padding: '15px', background: '#667eea', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '18px' }}>
          📖 Browse Books
        </a>
        <a href="/upload" style={{ display: 'block', padding: '15px', background: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '18px' }}>
          📤 Upload Your Book
        </a>
        <a href="/admin" style={{ display: 'block', padding: '15px', background: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '8px', fontSize: '16px' }}>
          🔐 Admin Dashboard
        </a>
      </div>
      <div style={{ textAlign: 'left', background: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>✨ Why BookNaija?</h3>
        <ul style={{ color: '#666', lineHeight: '1.8', paddingLeft: '20px' }}>
          <li>🇳🇬 Built for Nigerian readers & authors</li>
          <li>📱 Works on all phones, even with weak signal</li>
          <li>🔒 Safe & moderated content</li>
          <li>💰 Authors upload free • Readers ₦1000/month</li>
        </ul>
      </div>
      <div style={{ marginTop: '40px', fontSize: '14px', color: '#999' }}>
        <p>© 2026 BookNaija • Made with 💚 for Nigerian storytellers</p>
        <p style={{ marginTop: '10px' }}>
          <a href="/privacy" style={{ color: '#667eea', margin: '0 10px' }}>Privacy Policy</a> • 
          <a href="/terms" style={{ color: '#667eea', margin: '0 10px' }}>Terms of Service</a> • 
          <a href="mailto:hello@booknaija.com" style={{ color: '#667eea', margin: '0 10px' }}>Contact</a>
        </p>
      </div>
    </div>
  );
}
