'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function Admin() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');
  const [revenue, setRevenue] = useState<any>(null);
  const [readerProgress, setReaderProgress] = useState<any>(null);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailResult, setEmailResult] = useState<any>(null);
  const [stats, setStats] = useState({ totalBooks: 0, pending: 0, flagged: 0, users: 0, reads: 0, authors: 0 });
  const [authors, setAuthors] = useState<any[]>([]);
  const [pendingBooks, setPendingBooks] = useState<any[]>([]);
  const [flaggedBooks, setFlaggedBooks] = useState<any[]>([]);

  // 🛡️ TWO-FACTOR SECURITY CHECK (Factor 1): Role OR Owner Email Verification
  useEffect(() => {
    if (status === 'loading') return;

    // Explicitly allow the owner's email OR the 'admin' role
    const isOwner = session?.user?.email === 'talktorose90@gmail.com';
    const isAdmin = session?.user?.role === 'admin';

    // If not logged in, AND not the owner, AND not an admin, kick them out immediately
    if (status === 'unauthenticated' || (!isOwner && !isAdmin)) {
      router.push('/');
      return;
    }
    
    // Note: We intentionally do NOT auto-authenticate here. 
    // Factor 2 requires the admin to manually enter the secret password below.
  }, [status, session, router]);

  useEffect(() => {
    if (!authenticated) return;

    // Fetch analytics data
    if (activeTab === 'analytics') {
      fetch('/api/books/admin-list').then(r => r.json()).then(data => {
        setStats({
          totalBooks: data.total || 0,
          pending: data.pending?.length || 0,
          flagged: data.flagged?.length || 0,
          users: data.users || 0,
          reads: data.reads || 0,
          authors: data.authors || 0
        });
        setPendingBooks(data.pending || []);
        setFlaggedBooks(data.flagged || []);
      });
    }

    if (activeTab === 'revenue') {
      fetch('/api/revenue/calculate')
        .then(r => r.json())
        .then(data => setRevenue(data))
        .catch(() => {});
    }

    if (activeTab === 'readers') {
      fetch('/api/competition/progress')
        .then(r => r.json())
        .then(data => setReaderProgress(data))
        .catch(() => {});
    }

    if (activeTab === 'authors') {
      fetch('/api/authors/list').then(r => r.json()).then(data => setAuthors(data.authors || [])).catch(() => {});
    }

    if (activeTab === 'approve') {
      fetch('/api/books/admin-list').then(r => r.json()).then(data => setPendingBooks(data.pending || [])).catch(() => {});
    }

    if (activeTab === 'abuse') {
      fetch('/api/books/admin-list').then(r => r.json()).then(data => setFlaggedBooks(data.flagged || [])).catch(() => {});
    }
  }, [authenticated, activeTab]);

  // 🛡️ TWO-FACTOR SECURITY CHECK (Factor 2): Password Verification
  const handleLogin = async (e: any) => {
    e.preventDefault();
    const res = await fetch('/api/verify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const result = await res.json();
    if (result.valid) {
      setAuthenticated(true); // ✅ Only set to true if BOTH role/email and password match
    } else { 
      setLoginError('❌ Incorrect password'); 
      setTimeout(() => setLoginError(''), 2000); 
    }
  };

  const sendAuthorReports = async () => {
    if (!confirm('Send monthly earnings reports to all authors?')) return;

    setSendingEmails(true);
    setEmailResult(null);

    try {
      const res = await fetch('/api/authors/send-reports', { method: 'POST' });
      const result = await res.json();
      setEmailResult(result);

      if (result.success) {
        alert(`✅ Sent ${result.sent} reports successfully!`);
      } else {
        alert('❌ ' + (result.error || 'Failed to send reports'));
      }
    } catch (error) {
      alert('❌ Network error');
    } finally {
      setSendingEmails(false);
    }
  };

  const conductPrizeDraw = async () => {
    if (!confirm('Are you sure you want to conduct the prize draw?')) return;

    const res = await fetch('/api/competition/draw', { method: 'POST' });
    const result = await res.json();

    if (result.success) {
      alert(`🎉 Winners Selected!\n\n${result.winners.map((w: any) => `#${w.rank}: ${w.name} - ₦${w.prize}`).join('\n')}`);
    } else {
      alert('❌ ' + result.message);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/books/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: id, status })
    });
    // Refresh data
    const res = await fetch('/api/books/admin-list');
    const data = await res.json();
    setPendingBooks(data.pending || []);
    setFlaggedBooks(data.flagged || []);
    setStats(prev => ({ ...prev, pending: data.pending?.length || 0, flagged: data.flagged?.length || 0 }));
  };

  // Show login screen if not yet authenticated (even if role is admin or owner)
  if (!authenticated) {
    return (
      <div style={{ padding: '30px', maxWidth: '400px', margin: '100px auto', fontFamily: 'Arial' }}>
        <h2 style={{ color: '#667eea', textAlign: 'center' }}>🔐 Admin Verification</h2>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '20px' }}>
          Two-factor security active. Please enter your secret admin password.
        </p>
        {loginError && <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px', textAlign: 'center' }}>{loginError}</div>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="password" 
            value={password} 
            onChange={(e: any) => setPassword(e.target.value)} 
            placeholder="Enter secret admin password" 
            required 
            style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }} 
          />
          <button type="submit" style={{ padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>Unlock Dashboard</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#667eea', textAlign: 'center' }}>🛡️ Admin Dashboard</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => setActiveTab('analytics')} style={{ padding: '10px 15px', background: activeTab === 'analytics' ? '#6c757d' : '#f1f1f1', color: activeTab === 'analytics' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>📊 Analytics</button>
        <button onClick={() => setActiveTab('revenue')} style={{ padding: '10px 15px', background: activeTab === 'revenue' ? '#28a745' : '#f1f1f1', color: activeTab === 'revenue' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>💰 Revenue</button>
        <button onClick={() => setActiveTab('readers')} style={{ padding: '10px 15px', background: activeTab === 'readers' ? '#667eea' : '#f1f1f1', color: activeTab === 'readers' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>📚 Reader Progress</button>
        <button onClick={() => setActiveTab('upload')} style={{ padding: '10px 15px', background: activeTab === 'upload' ? '#667eea' : '#f1f1f1', color: activeTab === 'upload' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>📤 Upload</button>
        <button onClick={() => setActiveTab('approve')} style={{ padding: '10px 15px', background: activeTab === 'approve' ? '#17a2b8' : '#f1f1f1', color: activeTab === 'approve' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>✅ Approve ({stats.pending})</button>
        <button onClick={() => setActiveTab('abuse')} style={{ padding: '10px 15px', background: activeTab === 'abuse' ? '#dc3545' : '#f1f1f1', color: activeTab === 'abuse' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>🛡️ Abuse ({stats.flagged})</button>
        <button onClick={() => setActiveTab('authors')} style={{ padding: '10px 15px', background: activeTab === 'authors' ? '#fd7e14' : '#f1f1f1', color: activeTab === 'authors' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>✍️ Authors ({authors.length})</button>
      </div>

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div>
          <h3>📊 Platform Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ background: '#e7f3ff', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '32px', color: '#0056b3' }}>{stats.totalBooks}</h3>
              <p style={{ margin: '5px 0 0', color: '#666' }}>Total Books</p>
            </div>
            <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '32px', color: '#856404' }}>{stats.pending}</h3>
              <p style={{ margin: '5px 0 0', color: '#666' }}>Pending</p>
            </div>
            <div style={{ background: '#f8d7da', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '32px', color: '#721c24' }}>{stats.flagged}</h3>
              <p style={{ margin: '5px 0 0', color: '#666' }}>Flagged</p>
            </div>
            <div style={{ background: '#d4edda', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '32px', color: '#155724' }}>{stats.authors}</h3>
              <p style={{ margin: '5px 0 0', color: '#666' }}>Authors</p>
            </div>
            <div style={{ background: '#e2e3e5', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '32px', color: '#383d41' }}>{stats.users}</h3>
              <p style={{ margin: '5px 0 0', color: '#666' }}>Users</p>
            </div>
            <div style={{ background: '#cce5ff', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '32px', color: '#004085' }}>{stats.reads}</h3>
              <p style={{ margin: '5px 0 0', color: '#666' }}>Total Reads</p>
            </div>
          </div>
        </div>
      )}

      {/* REVENUE TAB */}
      {activeTab === 'revenue' && revenue && (
        <div>
          <h3>💰 Monthly Revenue Report</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
            <div style={{ background: '#28a745', padding: '20px', borderRadius: '12px', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '14px' }}>Total Revenue</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>₦{revenue.revenue?.estimatedMonthly?.toLocaleString()}</div>
            </div>
            <div style={{ background: '#fd7e14', padding: '20px', borderRadius: '12px', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '14px' }}>Author Pool</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>₦{revenue.revenue?.authorPool?.toLocaleString()}</div>
              <div style={{ fontSize: '12px' }}>Pay to authors</div>
            </div>
            <div style={{ background: '#667eea', padding: '20px', borderRadius: '12px', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '14px' }}>Your Profit</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>₦{revenue.revenue?.platformProfit?.toLocaleString()}</div>
              <div style={{ fontSize: '12px' }}>Keep this</div>
            </div>
            <div style={{ background: '#dc3545', padding: '20px', borderRadius: '12px', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '14px' }}>Prize Pool</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>₦{revenue.revenue?.prizePool?.toLocaleString()}</div>
              <div style={{ fontSize: '12px' }}>For readers</div>
            </div>
          </div>

          <div style={{ background: '#e7f3ff', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
            <h4 style={{ marginTop: 0, color: '#004085' }}>📧 Author Reports</h4>
            <p style={{ color: '#004085', marginBottom: '15px' }}>Send monthly earnings reports to all authors automatically</p>
            <button
              onClick={sendAuthorReports}
              disabled={sendingEmails}
              style={{ padding: '12px 30px', background: sendingEmails ? '#999' : '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: sendingEmails ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}
            >
              {sendingEmails ? '📧 Sending...' : '📧 Send Reports to All Authors'}
            </button>
            {emailResult && <p style={{ marginTop: '15px', color: '#155724' }}>✅ Sent {emailResult.sent} of {emailResult.total} reports</p>}
          </div>

          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
            <h4>📊 Platform Stats</h4>
            <p><strong>Total Readers:</strong> {revenue.summary?.totalReaders}</p>
            <p><strong>Active Subscriptions:</strong> {revenue.summary?.activeSubscriptions}</p>
            <p><strong>Total Books:</strong> {revenue.summary?.totalBooks}</p>
            <p><strong>Total Reads:</strong> {revenue.summary?.totalReads}</p>
          </div>
        </div>
      )}

      {/* READER PROGRESS TAB */}
      {activeTab === 'readers' && readerProgress && (
        <div>
          <h3>📚 Reader Progress & Prize Draw</h3>
          <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
            <h4>🏆 Prize Status</h4>
            <p><strong>Qualified Readers:</strong> {readerProgress.prizeDrawInfo?.qualifiedCount} (need 3+ to draw)</p>
            <p><strong>Status:</strong> {readerProgress.prizeDrawInfo?.nextDraw}</p>
            <p><strong>Method:</strong> {readerProgress.prizeDrawInfo?.drawMethod}</p>
            {readerProgress.prizeDrawInfo?.canDraw && (
              <button onClick={conductPrizeDraw} style={{ padding: '12px 30px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                🎉 Conduct Prize Draw Now
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px' }}>
              <h4>✅ Qualified (50+ books) - {readerProgress.categories?.qualified?.count} readers</h4>
              {readerProgress.categories?.qualified?.readers?.map((r: any, i: number) => (
                <div key={i} style={{ padding: '8px', background: 'white', borderRadius: '6px', marginBottom: '5px' }}>
                  <strong>{r.name}</strong> - {r.booksRead} books {r.status}
                </div>
              ))}
            </div>
            <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px' }}>
              <h4>🔥 Nearly Qualified (40-49 books) - {readerProgress.categories?.nearlyQualified?.count} readers</h4>
              {readerProgress.categories?.nearlyQualified?.readers?.slice(0, 5).map((r: any, i: number) => (
                <div key={i} style={{ padding: '8px', background: 'white', borderRadius: '6px', marginBottom: '5px' }}>
                  <strong>{r.name}</strong> - {r.booksRead} books ({r.progress})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD TAB */}
      {activeTab === 'upload' && (
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>📤 Upload Your Own Book</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>As admin, your uploads go through the same approval process.</p>
          <iframe src="/upload" style={{ width: '100%', height: '450px', border: 'none', borderRadius: '8px' }} title="Admin Upload"></iframe>
        </div>
      )}

      {/* APPROVE TAB */}
      {activeTab === 'approve' && (
        <div>
          <h3>✅ Pending Approvals</h3>
          {pendingBooks.length === 0 ? <p style={{ color: '#666' }}>No pending books. Upload a book first!</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingBooks.map((b: any) => (
                <div key={b._id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <strong>{b.title}</strong> by {b.authorName}<br/>
                  <small style={{ color: '#666' }}>📅 {new Date(b.createdAt).toLocaleDateString()}</small>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => updateStatus(b._id, 'published')} style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✅ Approve</button>
                    <button onClick={() => updateStatus(b._id, 'rejected')} style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🚫 Reject</button>
                    <a href={b.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', textDecoration: 'none' }}>👁️ Preview</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABUSE TAB */}
      {activeTab === 'abuse' && (
        <div>
          <h3>🛡️ Abuse Detection & Moderation</h3>
          <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <strong>⚠️ Auto-Detection Rules Active:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px', color: '#856404' }}>
              <li>Spam keywords: casino, betting, loan, xxx, free money, crypto scam, hack</li>
              <li>Oversized files: &gt;5MB flagged automatically</li>
              <li>User reports: 3+ reports = auto-flagged</li>
            </ul>
          </div>
          {flaggedBooks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#d4edda', borderRadius: '12px' }}>
              <p style={{ color: '#155724', fontSize: '18px', margin: 0 }}>✅ No flagged books. System is clean!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {flaggedBooks.map((b: any) => (
                <div key={b._id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '2px solid #dc3545' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <strong>{b.title}</strong> by {b.authorName}<br/>
                      <small style={{ color: '#666' }}>📅 {new Date(b.createdAt).toLocaleDateString()}</small>
                    </div>
                    <span style={{ background: '#dc3545', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                      🚩 {b.reports || 0} reports
                    </span>
                  </div>
                  {b.abuseFlags && b.abuseFlags.length > 0 && (
                    <div style={{ marginTop: '8px', background: '#f8d7da', padding: '8px', borderRadius: '4px', fontSize: '13px', color: '#721c24' }}>
                      <strong>⚠️ Flags:</strong> {b.abuseFlags.join(', ')}
                    </div>
                  )}
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => updateStatus(b._id, 'published')} style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✅ Override & Approve</button>
                    <button onClick={() => updateStatus(b._id, 'rejected')} style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Delete</button>
                    <a href={b.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', textDecoration: 'none' }}>👁️ Review</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AUTHORS TAB */}
      {activeTab === 'authors' && (
        <div>
          <h3>✍️ Registered Authors</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>Authors self-register via <a href="/author-onboarding" style={{ color: '#667eea' }}>/author-onboarding</a></p>
          {authors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '12px' }}>
              <p style={{ color: '#666' }}>No authors registered yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {authors.map((a: any) => (
                <div key={a._id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <strong style={{ fontSize: '16px' }}>{a.fullName}</strong><br/>
                      <small style={{ color: '#666' }}>📧 {a.email} • 📱 {a.phoneNumber}<br/>📍 {a.location}, {a.state}</small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ background: '#d4edda', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', color: '#155724' }}>✅ Verified</div>
                      <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>📅 Joined {new Date(a.createdAt).toLocaleDateString()}</small>
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '6px', fontSize: '13px' }}>
                    <strong>💰 Payment Details:</strong><br/>{a.bankName} • {a.accountNumber} ({a.accountName})
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    📚 Books: {a.totalBooks || 0} • 👁️ Reads: {a.totalReads || 0} • 💵 Earnings: ₦{(a.earnings || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button onClick={() => setAuthenticated(false)} style={{ padding: '10px 30px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🔓 Lock Dashboard</button>
      </div>
    </div>
  );
}
