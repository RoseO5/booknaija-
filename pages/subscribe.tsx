export default function Subscribe() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      padding: '30px 20px'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '15px', padding: '40px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' }}>
        <h1 style={{ textAlign: 'center', color: '#667eea', marginBottom: '10px' }}>💳 Subscribe to BookNaija</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>₦1,000/month • Unlimited Access • Cancel Anytime</p>
        
        <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '10px', marginBottom: '25px', borderLeft: '4px solid #ffc107' }}>
          <strong>⚠️ TEST MODE:</strong> No real money charged. This is for testing only.
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          alert('✅ Subscription successful! (Test mode - no real payment)');
          window.location.href = '/books';
        }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Full Name</label>
            <input 
              type="text" 
              required
              style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Email Address</label>
            <input 
              type="email" 
              required
              style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Phone Number</label>
            <input 
              type="tel" 
              placeholder="08012345678"
              required
              style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Network</label>
            <select style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px' }}>
              <option>MTN</option>
              <option>Airtel</option>
              <option>Glo</option>
              <option>9mobile</option>
            </select>
          </div>

          <div style={{ background: '#d1ecf1', padding: '15px', borderRadius: '10px', marginTop: '10px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>📚 What You Get:</h3>
            <ul style={{ margin: '0', paddingLeft: '20px', color: '#0c5460' }}>
              <li>Unlimited access to all Nigerian books</li>
              <li>Read 50 books in 6 months → Enter ₦5,000 prize draw</li>
              <li>Support local authors with every page you read</li>
              <li>Cancel anytime, no questions asked</li>
            </ul>
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
            Subscribe Now (Free Test Mode)
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <a href="/" style={{ color: '#667eea', textDecoration: 'none' }}>← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
