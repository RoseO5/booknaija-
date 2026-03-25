'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading dashboard...</div>;
  if (!stats || !stats.summary) return <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}>Error loading stats</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '30px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0 }}>📊 BookNaija Dashboard</h1>
          <a href="/" style={{ color: 'white', background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '20px', textDecoration: 'none' }}>← Home</a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '5px' }}>Total Readers</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.summary.totalReaders || 0}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '5px' }}>Active Subs</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.summary.activeSubscriptions || 0}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '5px' }}>Total Books</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.summary.totalBooks || 0}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '5px' }}>Total Reads</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.summary.totalReads || 0}</div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '15px', padding: '30px', marginBottom: '30px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem' }}>💰 Revenue Model (Test Mode)</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Reader Pays</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₦1,000</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>per month</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Author Pool</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₦{(stats.revenue?.authorPool || 0).toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>50% of revenue</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Platform</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₦{(stats.revenue?.platformProfit || 0).toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>After prizes</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Prize Pool</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₦{(stats.revenue?.prizePool || 0).toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>₦5k × 3 winners</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginBottom: '30px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '15px', padding: '25px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3rem' }}>🏆 Prize System</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', color: '#fff' }}>
              <li>₦5,000 × 3 winners every 6 months</li>
              <li>Must read 50+ UNIQUE books to qualify</li>
              <li>Top 3 readers selected automatically</li>
              <li>Eligible readers: {stats.summary.eligibleForPrize || 0}</li>
              <li>Status: {stats.prizeStatus?.nextDraw || 'Loading...'}</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '15px', padding: '25px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3rem' }}>✍️ Author Earnings</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', color: '#fff' }}>
              <li>Pool: ₦{(stats.revenue?.authorPool || 0).toLocaleString()} monthly</li>
              <li>70% based on Minutes Read</li>
              <li>30% based on Unique Readers</li>
              <li>Fair & anti-cheating system</li>
              <li>Paid from revenue pool (50/50 split)</li>
            </ul>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '15px', padding: '30px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem' }}>📊 Reading Statistics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div>
              <strong>Total Minutes Read:</strong><br/>
              {(stats.summary.totalMinutes || 0).toLocaleString()} mins
            </div>
            <div>
              <strong>Average per Reader:</strong><br/>
              {stats.summary.totalReaders > 0 ? Math.round((stats.summary.totalMinutes || 0) / stats.summary.totalReaders) : 0} mins
            </div>
            <div>
              <strong>Books per Reader:</strong><br/>
              {stats.summary.totalReaders > 0 ? ((stats.summary.totalReads || 0) / stats.summary.totalReaders).toFixed(1) : 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
