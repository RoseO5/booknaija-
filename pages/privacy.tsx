export default function Privacy() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial', lineHeight: '1.6' }}>
      <h1 style={{ color: '#667eea' }}>🔒 Privacy Policy</h1>
      <p><strong>Last updated:</strong> {new Date().toLocaleDateString('en-NG')}</p>
      
      <h3>📋 What We Collect</h3>
      <ul>
        <li>Your email (for account management)</li>
        <li>Books you upload or read (to show your library)</li>
        <li>Payment confirmation from Paystack/Selar (to activate subscriptions)</li>
      </ul>
      
      <h3>🛡️ How We Protect Your Data</h3>
      <ul>
        <li>We never sell your data</li>
        <li>We use secure connections (HTTPS) everywhere</li>
        <li>Only you and our admin can access your account</li>
      </ul>
      
      <h3>🗑️ Your Rights</h3>
      <p>Want your data deleted? Email us at <strong>hello@booknaija.com</strong> and we'll remove your account within 48 hours.</p>
      
      <h3>🇳🇬 Compliance</h3>
      <p>BookNaija complies with Nigeria's Data Protection Regulation (NDPR). We are a small startup focused on serving Nigerian readers and authors.</p>
      
      <p style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        Questions? Contact us: <a href="mailto:hello@booknaija.com">hello@booknaija.com</a>
      </p>
    </div>
  );
}
