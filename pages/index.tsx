export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '50px 20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', margin: '0 0 20px 0' }}>📚 BookNaija</h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '40px' }}>
          Read Nigerian Books • Support Local Authors • Win Monthly Prizes
        </p>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          padding: '40px',
          marginBottom: '40px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '2rem' }}>🎯 What We Offer</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '10px' }}>
              <strong>₦1,000/month</strong><br/>Unlimited Access
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '10px' }}>
              <strong>₦5,000 Prize</strong><br/>Top 3 Readers
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '10px' }}>
              <strong>Author Rewards</strong><br/>Per Minute Read
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/subscribe" style={{ 
            background: '#fff', 
            color: '#667eea', 
            padding: '15px 40px', 
            borderRadius: '50px', 
            textDecoration: 'none', 
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}>
            📖 Start Reading
          </a>
          <a href="/admin" style={{ 
            background: 'transparent', 
            color: '#fff', 
            padding: '15px 40px', 
            borderRadius: '50px', 
            border: '2px solid white',
            textDecoration: 'none',
            fontSize: '1.1rem'
          }}>
            ➕ Upload Book
          </a>
        </div>

        <div style={{ marginTop: '50px', fontSize: '0.9rem', opacity: 0.7 }}>
          <p>Phase 1: Building • No real money yet • Test mode</p>
        </div>
      </div>
    </div>
  );
}
