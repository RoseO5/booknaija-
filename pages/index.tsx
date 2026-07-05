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
        <ul style={{ color: '#666', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
          <li>🇳🇬 Built for Nigerian readers & authors</li>
          <li>📱 Works on all phones, even with weak signal</li>
          <li>🔒 Safe, moderated, and CAC-compliant content</li>
          <li>💰 Authors upload free • Readers ₦1000/month</li>
        </ul>
      </div>

      {/* 🏆 READER REWARD PROGRAM (TRUST BUILDER) */}
      <div style={{ textAlign: 'left', padding: '25px', background: 'linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%)', borderRadius: '12px', border: '1px solid #ffc107', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, color: '#856404', textAlign: 'center' }}>🏆 The Reader Reward Program</h3>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: '15px', fontSize: '14px' }}>
          We believe in rewarding dedication, not luck. Our program celebrates committed readers.
        </p>
        <ul style={{ color: '#856404', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
          <li><strong>Merit-Based:</strong> Read and review 50 books to qualify. No lotteries, no lucky draws.</li>
          <li><strong>Bi-Annual Cycles:</strong> Reading cycles run for 6 months. Rewards are distributed strictly <strong>twice a year</strong> (June & December).</li>
          <li><strong>₦5,000 Literary Grant:</strong> Awarded to readers who successfully complete the 50-book challenge.</li>
        </ul>
        <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '15px', marginBottom: 0, fontStyle: 'italic' }}>
          *This is a loyalty reward for active reading and literacy promotion, not an investment or Ponzi scheme.
        </p>
      </div>

      {/* WhatsApp Communities */}
      <div style={{ padding: '20px', background: '#e7f3ff', borderRadius: '12px', border: '1px solid #b8daff', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, color: '#004085' }}>💬 Join Our Communities</h3>
        <p style={{ color: '#004085', fontSize: '14px', marginBottom: '15px' }}>
          Connect with fellow readers and authors!
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a 
            href="https://chat.whatsapp.com/IDewvgS4R724cJ0YkTt69O?mode=gi_t" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ display: 'block', padding: '12px', background: '#25D366', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center' }}
          >
            📚 Readers WhatsApp Group
          </a>
          
          {userRole === 'author' && (
            <a 
              href="https://chat.whatsapp.com/CXGZwp4tcdR5TwXFp53lye?mode=gi_t" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ display: 'block', padding: '12px', background: '#25D366', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center' }}
            >
              ✍️ Authors WhatsApp Group (VIP)
            </a>
          )}
        </div>
      </div>

      {/* Footer with Contact Info */}
      <div style={{ marginTop: '40px', fontSize: '14px', color: '#999' }}>
        <p>© 2026 BookNaija • Made with 💚 for Nigerian storytellers</p>
        <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'left' }}>
          <p style={{ margin: '5px 0', color: '#666', textAlign: 'center' }}>
            <strong>📧 Email:</strong>{' '}
            <a href="mailto:talktorose90@gmail.com" style={{ color: '#667eea' }}>talktorose90@gmail.com</a>
          </p>
          <p style={{ margin: '5px 0', color: '#666', textAlign: 'center' }}>
            <strong>📞 Phone:</strong>{' '}
            <a href="tel:+2348142750728" style={{ color: '#667eea' }}>08142750728</a>
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
