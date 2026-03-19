export default function Dashboard() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '30px 20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0 }}>📊 BookNaija Dashboard</h1>
          <a href="/" style={{ color: 'white', background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '20px', textDecoration: 'none' }}>← Home</a>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '15px', padding: '30px', marginBottom: '30px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem' }}>💰 Revenue Model (Test Mode)</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '5px' }}>Reader Pays</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>₦1,000</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>per month</div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '5px' }}>Author Pool</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>₦500</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>50% split</div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '5px' }}>Platform</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>₦500</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>50% profit</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginBottom: '30px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '15px', padding: '25px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3rem' }}>🏆 Prize System</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>₦5,000 × 3 winners every 6 months</li>
              <li>Must read 50+ books to qualify</li>
              <li>Top 3 readers selected automatically</li>
              <li>Funded from subscription pool</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '15px', padding: '25px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3rem' }}>✍️ Author Earnings</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Earn ₦5 airtime per 20 minutes read</li>
              <li>Airtime sent on 5th of each month</li>
              <li>Convert to cash via local dealers</li>
              <li>No paperwork, no CAC needed</li>
            </ul>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '15px', padding: '30px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem' }}>🚀 Phase 1 vs Phase 2</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div>
              <h3 style={{ color: '#4ade80', margin: '0 0 15px 0' }}>✅ Phase 1 (Now)</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                <li style={{ listStyle: 'none' }}>✅ Mock data only</li>
                <li style={{ listStyle: 'none' }}>✅ No real payments</li>
                <li style={{ listStyle: 'none' }}>✅ Test mode features</li>
                <li style={{ listStyle: 'none' }}>✅ UI/UX ready</li>
                <li style={{ listStyle: 'none' }}>✅ No MongoDB needed</li>
              </ul>
            </div>
            
            <div>
              <h3 style={{ color: '#fbbf24', margin: '0 0 15px 0' }}>🔜 Phase 2 (Next)</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                <li style={{ listStyle: 'none' }}>🔜 MongoDB integration</li>
                <li style={{ listStyle: 'none' }}>🔜 Paystack live mode</li>
                <li style={{ listStyle: 'none' }}>🔜 Real book uploads</li>
                <li style={{ listStyle: 'none' }}>🔜 CAC registration</li>
                <li style={{ listStyle: 'none' }}>🔜 Airtime payouts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
