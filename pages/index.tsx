'use client';
import { useSession, signOut } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ color: '#667eea', fontSize: '32px', marginBottom: '10px' }}>📚 BookNaija</h1>
        <p style={{ color: '#666', fontSize: '18px', lineHeight: '1.5' }}>
          Discover and share Nigerian stories.<br/>
          <span style={{ fontSize: '16px', color: '#999' }}>Built for Nigerian readers & authors</span>
        </p>
      </div>

      {/* Main Action Buttons */}
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
        {session && (
          <button 
            onClick={() => signOut()} 
            style={{ 
              padding: '15px', 
              background: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '16px', 
              cursor: 'pointer' 
            }}
          >
            🚪 Sign Out
          </button>
        )}
      </div>

      {/* Why BookNaija Section */}
      <div style={{ textAlign: 'left', background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>✨ Why BookNaija?</h3>
        <ul style={{ color: '#666', lineHeight: '1.8', paddingLeft: '20px' }}>
          <li>🇳🇬 Built for Nigerian readers & authors</li>
          <li>📱 Works on all phones, even with weak signal</li>
          <li>🔒 Safe & moderated content</li>
          <li>💰 Authors upload free • Readers ₦1000/month</li>
        </ul>
      </div>

      {/* WhatsApp Communities */}
      <div style={{ padding: '20px', background: '#e7f3ff', borderRadius: '12px', border: '1px solid #b8daff', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, color: '#004085' }}>💬 Join Our Communities</h3>
        <p style={{ color: '#004085', fontSize: '14px', marginBottom: '15px' }}>
          Connect with fellow readers and authors!
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Readers Group - Show to everyone */}
          <a 
            href="https://chat.whatsapp.com/IDewvgS4R724cJ0YkTt69O?mode=gi_t" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
              display: 'block', 
              padding: '12px', 
              background: '#25D366', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              textAlign: 'center' 
            }}
          >
            📚 Readers WhatsApp Group
          </a>
          
          {/* Authors Group - Only show if user is an author */}
          {userRole === 'author' && (
            <a 
              href="https://chat.whatsapp.com/CXGZwp4tcdR5TwXFp53lye?mode=gi_t" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                display: 'block', 
                padding: '12px', 
                background: '#25D366', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                textAlign: 'center' 
              }}
            >
              ✍️ Authors WhatsApp Group
            </a>
          )}
        </div>
      </div>

      {/* Footer with Contact Info */}
      <div style={{ marginTop: '40px', fontSize: '14px', color: '#999' }}>
        <p>© 2026 BookNaija • Made with 💚 for Nigerian storytellers</p>
        <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
          <p style={{ margin: '5px 0', color: '#666' }}>
            <strong>📧 Email:</strong>{' '}
            <a href="mailto:talktorose90@gmail.com" style={{ color: '#667eea' }}>
              talktorose90@gmail.com
            </a>
          </p>
          <p style={{ margin: '5px 0', color: '#666' }}>
            <strong>📞 Phone:</strong>{' '}
            <a href="tel:+2348142750728" style={{ color: '#667eea' }}>
              08142750728
            </a>
          </p>
        </div>
        <p style={{ marginTop: '15px' }}>
          <a href="/privacy" style={{ color: '#667eea', margin: '0 10px' }}>Privacy Policy</a> • 
          <a href="/terms" style={{ color: '#667eea', margin: '0 10px' }}>Terms of Service</a>
        </p>
      </div>
    </div>
  );
}
