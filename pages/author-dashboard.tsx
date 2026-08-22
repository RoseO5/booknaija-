'use client';
import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';

export default function AuthorDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      fetch(`/api/authors/earnings?email=${session.user.email}`)
        .then(r => r.json())
        .then(d => {
          setData(d);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, session]);

  if (status === 'loading' || loading) {
    return <div style={{padding:'40px',textAlign:'center',fontFamily:'Arial'}}>Loading your dashboard...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{padding:'40px',textAlign:'center',maxWidth:'500px',margin:'50px auto',fontFamily:'Arial'}}>
        <h2 style={{color:'#667eea'}}>✍️ Author Dashboard</h2>
        <p style={{color:'#666',marginBottom:'20px'}}>Sign in to view your earnings and books</p>
        <button onClick={() => signIn('google')} style={{padding:'12px 30px',background:'#4285f4',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'bold',fontSize:'16px'}}>
          🔐 Sign in with Google
        </button>
      </div>
    );
  }

  // ✅ SMART REDIRECT: If not an author yet, show friendly onboarding prompt
  if (!data?.isAuthor) {
    return (
      <div style={{padding:'20px',maxWidth:'600px',margin:'50px auto',fontFamily:'Arial'}}>
        <div style={{textAlign:'center',background:'linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%)',padding:'40px',borderRadius:'16px',border:'2px solid #ffc107'}}>
          <div style={{fontSize:'64px',marginBottom:'20px'}}>✍️</div>
          <h2 style={{color:'#856404',marginBottom:'15px'}}>Welcome to BookNaija Authors!</h2>
          <p style={{color:'#666',fontSize:'16px',lineHeight:'1.6',marginBottom:'25px'}}>
            We're excited to have you! To access your Author Dashboard and start tracking your earnings, please complete your author profile first.
          </p>
          <a href="/author-onboarding" style={{display:'inline-block',padding:'15px 40px',background:'#fd7e14',color:'white',textDecoration:'none',borderRadius:'8px',fontWeight:'bold',fontSize:'18px',boxShadow:'0 4px 12px rgba(253,126,20,0.3)'}}>
            🚀 Complete Your Author Profile
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:'20px',maxWidth:'800px',margin:'0 auto',fontFamily:'Arial'}}>
      {/* Header with Upload Button */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'30px',flexWrap:'wrap',gap:'15px'}}>
        <div>
          <h1 style={{color:'#667eea',margin:0}}>✍️ My Author Dashboard</h1>
          <p style={{color:'#666',margin:'5px 0 0'}}>Welcome, {data.author?.name}!</p>
        </div>
        {/* ✅ FEATURE 1: Upload directly from dashboard */}
        <a href="/upload" style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'12px 24px',background:'#28a745',color:'white',textDecoration:'none',borderRadius:'8px',fontWeight:'bold',fontSize:'16px',boxShadow:'0 4px 12px rgba(40,167,69,0.3)'}}>
          📤 Upload New Book
        </a>
      </div>

      {/* Authors WhatsApp Community Section */}
      <div style={{background:'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',padding:'25px',borderRadius:'12px',color:'white',textAlign:'center',marginBottom:'30px',boxShadow:'0 4px 12px rgba(37,211,102,0.3)'}}>
        <div style={{fontSize:'48px',marginBottom:'10px'}}>💬</div>
        <h3 style={{marginTop:0,marginBottom:'10px',fontSize:'22px'}}>Join the BookNaija Authors Community</h3>
        <p style={{margin:'0 0 20px',fontSize:'15px',opacity:0.95,lineHeight:'1.6'}}>
          Connect with fellow Nigerian authors, share writing tips, get platform updates, and be part of a growing literary family!
        </p>
        <a href="https://chat.whatsapp.com/CXGZwp4tcdR5TwXFp53lye?s=cl&p=a&ilr=1" target="_blank" rel="noopener noreferrer" style={{display:'inline-block',padding:'14px 35px',background:'white',color:'#128C7E',textDecoration:'none',borderRadius:'30px',fontWeight:'bold',fontSize:'16px',boxShadow:'0 2px 8px rgba(0,0,0,0.2)'}}>
          💚 Join Authors WhatsApp Group
        </a>
      </div>

      {/* Earnings Overview */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'15px',marginBottom:'30px'}}>
        <div style={{background:'linear-gradient(135deg,#28a745 0%,#20c997 100%)',padding:'25px',borderRadius:'12px',color:'white',textAlign:'center'}}>
          <div style={{fontSize:'14px',opacity:0.9}}>Your Earnings</div>
          <div style={{fontSize:'32px',fontWeight:'bold'}}>₦{data.earnings?.toLocaleString() || 0}</div>
          <div style={{fontSize:'12px',opacity:0.8}}>This month</div>
        </div>
        <div style={{background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',padding:'25px',borderRadius:'12px',color:'white',textAlign:'center'}}>
          <div style={{fontSize:'14px',opacity:0.9}}>Total Books</div>
          <div style={{fontSize:'32px',fontWeight:'bold'}}>{data.stats?.books || 0}</div>
          <div style={{fontSize:'12px',opacity:0.8}}>Uploaded</div>
        </div>
        <div style={{background:'linear-gradient(135deg,#fd7e14 0%,#ffc107 100%)',padding:'25px',borderRadius:'12px',color:'white',textAlign:'center'}}>
          <div style={{fontSize:'14px',opacity:0.9}}>Total Reads</div>
          <div style={{fontSize:'32px',fontWeight:'bold'}}>{data.stats?.reads || 0}</div>
          <div style={{fontSize:'12px',opacity:0.8}}>All time</div>
        </div>
      </div>

      {/* ✅ FEATURE 2: My Uploaded Books List */}
      <div style={{background:'white',padding:'25px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',marginBottom:'30px'}}>
        <h3 style={{marginTop:0,color:'#333',marginBottom:'20px'}}>📚 My Uploaded Books</h3>
        
        {data.stats?.booksList && data.stats.booksList.length > 0 ? (
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {data.stats.booksList.map((book: any, index: number) => (
              <div key={index} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'15px',background:'#f8f9fa',borderRadius:'8px',borderLeft:`4px solid ${book.status === 'published' ? '#28a745' : '#ffc107'}`}}>
                <div>
                  <div style={{fontWeight:'bold',color:'#333',fontSize:'16px'}}>{book.title}</div>
                  <div style={{fontSize:'13px',color:'#666',marginTop:'4px'}}>{book.genre} • Uploaded: {book.createdAt}</div>
                </div>
                <span style={{
                  padding:'6px 12px',
                  borderRadius:'20px',
                  fontSize:'12px',
                  fontWeight:'bold',
                  background: book.status === 'published' ? '#d4edda' : '#fff3cd',
                  color: book.status === 'published' ? '#155724' : '#856404',
                  textTransform:'uppercase'
                }}>
                  {book.status === 'published' ? '✅ Published' : '⏳ Pending Approval'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{textAlign:'center',padding:'30px',color:'#666',background:'#f8f9fa',borderRadius:'8px'}}>
            <p style={{margin:0,fontSize:'16px'}}>You haven't uploaded any books yet.</p>
            <a href="/upload" style={{display:'inline-block',marginTop:'15px',padding:'10px 20px',background:'#667eea',color:'white',textDecoration:'none',borderRadius:'6px',fontWeight:'bold'}}>Upload Your First Book</a>
          </div>
        )}
      </div>

      {/* Earnings Breakdown */}
      <div style={{background:'white',padding:'25px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',marginBottom:'20px'}}>
        <h3 style={{marginTop:0,color:'#333'}}>💰 Earnings Breakdown</h3>
        <div style={{background:'#f8f9fa',padding:'15px',borderRadius:'8px',marginBottom:'15px'}}>
          <p style={{margin:'0 0 10px',color:'#666'}}><strong>Calculation Method:</strong></p>
          <ul style={{margin:0,paddingLeft:'20px',color:'#666',lineHeight:'1.8'}}>
            <li><strong>70%</strong> based on total minutes readers spent on your books</li>
            <li><strong>30%</strong> based on unique readers who read your books</li>
          </ul>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'15px'}}>
          <div>
            <div style={{fontSize:'14px',color:'#666'}}>Minutes Share</div>
            <div style={{fontSize:'24px',fontWeight:'bold',color:'#28a745'}}>{data.breakdown?.minutesShare || 0}%</div>
          </div>
          <div>
            <div style={{fontSize:'14px',color:'#666'}}>Readers Share</div>
            <div style={{fontSize:'24px',fontWeight:'bold',color:'#667eea'}}>{data.breakdown?.readersShare || 0}%</div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div style={{background:'white',padding:'25px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)'}}>
        <h3 style={{marginTop:0,color:'#333'}}>💳 Payment Details</h3>
        <div style={{background:'#e7f3ff',padding:'15px',borderRadius:'8px'}}>
          <p style={{margin:'0 0 10px',color:'#004085'}}><strong>Bank:</strong> {data.author?.bank}</p>
          <p style={{margin:'0 0 10px',color:'#004085'}}><strong>Account:</strong> {data.author?.account}</p>
          <p style={{margin:0,color:'#004085'}}><strong>Name:</strong> {data.author?.accountName}</p>
        </div>
        <p style={{marginTop:'15px',fontSize:'14px',color:'#666'}}>
          💡 Payments are processed monthly. Update your details via the author onboarding form if needed.
        </p>
      </div>
    </div>
  );
}
