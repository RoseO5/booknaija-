'use client';
import { useSession, signOut } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();

  // ✅ Smart Checks for User Roles (Admin/Owner sees all for testing and management)
  const isAdmin = session?.user?.role === 'admin' || session?.user?.email === 'talktorose90@gmail.com';
  const isAuthor = session?.user?.role === 'author' || isAdmin;
  const isReader = session?.user?.role === 'reader' || isAdmin; // ✅ Shows for ALL readers + Admin

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ color: '#667eea', fontSize: '32px', marginBottom: '10px' }}>📚 BookNaija</h1>
        <p style={{ color: '#666', fontSize: '18px', lineHeight: '1.5' }}>
          Discover and share Nigerian stories, devotionals, and inspirational books.<br/>
          <span style={{ fontSize: '16px', color: '#999' }}>Built for Nigerian readers, authors, and ministers</span>
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

        {/* ✅ Smart Author Dashboard Button (Authors + Admin) */}
        {isAuthor && (
          <a href="/author-dashboard" style={{ display: 'block', padding: '15px', background: '#fd7e14', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '18px' }}>
            ✍️ My Author Dashboard
          </a>
        )}

        {/* ✅ Smart Reader Progress Button (ALL Readers + Admin) */}
        {isReader && (
          <a href="/leaderboard" style={{ display: 'block', padding: '15px', background: '#17a2b8', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '18px' }}>
            📊 My Reading Progress & Leaderboard
          </a>
        )}

        {/* ✅ Admin Button (Only for Admin/Owner) */}
        {isAdmin && (
          <a href="/admin" style={{ display: 'block', padding: '15px', background: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '8px', fontSize: '16px' }}>
            🔐 Admin Dashboard
          </a>
        )}

        {/* Sign Out Button (For any logged-in user) */}
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
          <li>🇳🇬 Built for Nigerian readers, authors, and ministers</li>
          <li>📚 <strong>Diverse Genres:</strong> Fiction, Christian devotionals, poetry, self-help, and non-fiction</li>
          <li>📱 Works on all phones, even with weak signal</li>
          <li>🔒 Safe, moderated, and community-focused content</li>
          <li>💰 Authors upload free • Readers ₦1000/month</li>
        </ul>
      </div>

      {/* 🏆 READER APPRECIATION PROGRAM */}
      <div style={{ textAlign: 'left', padding: '25px', background: 'linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%)', borderRadius: '12px', border: '1px solid #ffc107', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, color: '#856404', textAlign: 'center' }}>🏆 Reader Appreciation Program</h3>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: '15px', fontSize: '14px' }}>
          We believe in rewarding dedication. Our program celebrates committed readers who actively support local literature.
        </p>
        <ul style={{ color: '#856404', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
          <li><strong>Merit-Based Milestone:</strong> Read 50 unique books to qualify. No lotteries, no lucky draws.</li>
          <li><strong>Bi-Annual Cycles:</strong> Reading cycles run for 6 months. Rewards are distributed strictly twice a year.</li>
          <li><strong>₦5,000 Reading Bonus:</strong> Awarded as a token of appreciation to readers who successfully complete the 50-book challenge.</li>
        </ul>
        <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '15px', marginBottom: 0, fontStyle: 'italic' }}>
          *This is a structured loyalty reward for active reading and supporting Nigerian authors.
        </p>
      </div>

      {/* WhatsApp Communities (READERS ONLY FOR PUBLIC) */}
      <div style={{ padding: '20px', background: '#e7f3ff', borderRadius: '12px', border: '1px solid #b8daff', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, color: '#004085' }}>💬 Join Our Community</h3>
        <p style={{ color: '#004085', fontSize: '14px', marginBottom: '15px' }}>
          Connect with fellow readers and get updates on new books!
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a
            href="https://chat.whatsapp.com/IDewvgS4R724cJ0YkTt69O?mode=gi_t"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', padding: '12px', background: '#25D366', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center' }}
          >
            📚 Join Readers WhatsApp Group
          </a>
        </div>
      </div>

      {/* Footer with Contact Info (EMAIL ONLY FOR SAFETY) */}
      <div style={{ marginTop: '40px', fontSize: '14px', color: '#999' }}>
        <p>© 2026 BookNaija • Made with 💚 for Nigerian storytellers</p>
        <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ margin: '5px 0', color: '#666' }}>
            <strong>📧 Contact Us:</strong>{' '}
            <a href="mailto:talktorose90@gmail.com" style={{ color: '#667eea' }}>talktorose90@gmail.com</a>
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
