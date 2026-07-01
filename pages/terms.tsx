export default function Terms() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial', lineHeight: '1.6' }}>
      <h1 style={{ color: '#667eea' }}>📜 Terms of Service</h1>
      <p><strong>Effective Date:</strong> {new Date().toLocaleDateString('en-NG')}</p>
      
      <h3>✅ For Authors (Free to Upload)</h3>
      <ul>
        <li>You retain full ownership of your books</li>
        <li>You grant BookNaija a non-exclusive license to host and distribute your content</li>
        <li>You warrant that you own the rights to uploaded content</li>
        <li>You agree not to upload pirated, plagiarized, or illegal content</li>
        <li>You agree not to upload content that violates Nigerian law</li>
      </ul>
      
      <h3>✅ For Readers (₦1000/month Premium)</h3>
      <ul>
        <li>Subscription is billed monthly via Paystack</li>
        <li>You may cancel anytime from your account settings</li>
        <li>No refunds for partial months</li>
        <li>You may not share your account or redistribute content</li>
        <li>You may download books for personal offline reading only</li>
      </ul>
      
      <h3>🛡️ Content Moderation</h3>
      <ul>
        <li>We reserve the right to remove content that violates our terms</li>
        <li>We respond to takedown requests within 48 hours</li>
        <li>Users can report inappropriate content via the "Report" button</li>
      </ul>
      
      <h3>💳 Payments</h3>
      <ul>
        <li>All payments are processed securely by Paystack</li>
        <li>Prices are in Nigerian Naira (₦) and include all applicable taxes</li>
        <li>Subscription auto-renews unless cancelled</li>
      </ul>
      
      <h3>⚖️ Limitation of Liability</h3>
      <p>BookNaija is provided "as is" without warranties. We are not liable for:</p>
      <ul>
        <li>Loss of data or content</li>
        <li>Service interruptions</li>
        <li>Actions of third-party content providers</li>
      </ul>
      
      <h3>🇳🇬 Governing Law</h3>
      <p>These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in Nigerian courts.</p>
      
      <h3>📧 Contact</h3>
      <p>For questions about these terms, contact: <a href="mailto:hello@booknaija.com">hello@booknaija.com</a></p>
      
      <p style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        By using BookNaija, you agree to these terms.
      </p>
    </div>
  );
}
