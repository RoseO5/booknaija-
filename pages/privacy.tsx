export default function Privacy() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial', lineHeight: '1.6' }}>
      <h1 style={{ color: '#667eea' }}>🔒 Privacy Policy</h1>
      <p><strong>Last updated:</strong> {new Date().toLocaleDateString('en-NG')}</p>
      
      <h3>📋 What We Collect</h3>
      <ul>
        <li>Your email address (for account management)</li>
        <li>Books you upload or read (to show your library)</li>
        <li>Payment confirmation from Paystack (to activate subscriptions)</li>
        <li>Basic usage data (to improve our service)</li>
      </ul>
      
      <h3>🛡️ How We Protect Your Data</h3>
      <ul>
        <li>We never sell your personal data to third parties</li>
        <li>We use secure HTTPS connections everywhere</li>
        <li>Payment data is handled by Paystack (PCI-DSS compliant)</li>
        <li>We store data on secure servers (MongoDB Atlas, Cloudinary)</li>
      </ul>
      
      <h3>🗑️ Your Rights (NDPR Compliance)</h3>
      <p>Under Nigeria's Data Protection Regulation (NDPR), you have the right to:</p>
      <ul>
        <li>Request access to your personal data</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your account and data</li>
        <li>Object to processing of your data</li>
      </ul>
      <p>To exercise these rights, email us at <strong>hello@booknaija.com</strong></p>
      
      <h3>📞 Data Protection Officer</h3>
      <p>For privacy concerns, contact our Data Protection Officer at <strong>hello@booknaija.com</strong></p>
      
      <h3>🇳🇬 Compliance</h3>
      <p>BookNaija complies with Nigeria's Data Protection Regulation (NDPR) 2019. We are registered with the National Information Technology Development Agency (NITDA) as required.</p>
      
      <h3>🍪 Cookies</h3>
      <p>We use essential cookies for authentication and session management. We do not use tracking cookies for advertising.</p>
      
      <p style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        Questions? Contact us: <a href="mailto:hello@booknaija.com">hello@booknaija.com</a>
      </p>
    </div>
  );
}
