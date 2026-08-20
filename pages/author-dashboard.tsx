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
    return <div style={{padding:'40px',textAlign:'center'}}>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{padding:'40px',textAlign:'center',maxWidth:'500px',margin:'50px auto',fontFamily:'Arial'}}>
        <h2 style={{color:'#667eea'}}>✍️ Author Dashboard</h2>
        <p style={{color:'#666',marginBottom:'20px'}}>Sign in to view your earnings</p>
        <button onClick={() => signIn('google')} style={{padding:'12px 30px',background:'#4285f4',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'bold'}}>
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
            We're excited to have you as part of our community! To access your Author Dashboard and start tracking your earnings, please complete your author profile first.
          </p>
          <div style={{background:'white',padding:'20px',borderRadius:'12px',marginBottom:'25px',textAlign:'left'}}>
            <h4 style={{color:'#333',marginTop:0,marginBottom:'15px'}}>📋 What you'll get after completing your profile:</h4>
            <ul style={{color:'#666',lineHeight:'1.8',paddingLeft:'20px',margin:0}}>
              <li>✅ Access to your personal Author Dashboard</li>
              <li>✅ Track your book reads and earnings in real-time</li>
              <li>✅ View your monthly payment breakdown</li>
              <li>✅ Join the exclusive Authors WhatsApp community</li>
              <li>✅ Get paid directly to your bank account</li>
            </ul>
          </div>
          <a 
            href="/author-onboarding" 
            style={{
              display:'inline-block',
              padding:'15px 40px',
              background:'#fd7e14',
              color:'white',
              textDecoration:'none',
              borderRadius:'8px',
              fontWeight:'bold',
              fontSize:'18px',
              boxShadow:'0 4px 12px rgba(253,126,20,0.3)'
            }}
          >
            🚀 Complete Your Author Profile
          </a>
          <p style={{color:'#999',fontSize:'13px',marginTop:'20px',marginBottom:0}}>
            It only takes 2 minutes to set up! 💚
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:'20px',maxWidth:'800px',margin:'0 auto',fontFamily:'Arial'}}>
      <h1 style={{color:'#667eea',textAlign:'center'}}>✍️ My Author Dashboard</h1>
      <p style={{textAlign:'center',color:'#666',marginBottom:'30px'}}>
        Welcome, {data.author?.name}!
      </p>

      {/* Authors WhatsApp Community Section */}
      <div style={{
        background:'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
        padding:'25px',
        borderRadius:'12px',
        color:'white',
        textAlign:'center',
        marginBottom:'30px',
        boxShadow:'0 4px 12px rgba(37,211,102,0.3)'
      }}>
        <div style={{fontSize:'48px',marginBottom:'10px'}}>💬</div>
        <h3 style={{marginTop:0,marginBottom:'10px',fontSize:'22px'}}>Join the BookNaija Authors Community</h3>
        <p style={{margin:'0 0 20px',fontSize:'15px',opacity:0.95,lineHeight:'1.6'}}>
          Connect with fellow Nigerian authors, share writing tips, get platform updates, and be part of a growing literary family!
        </p>
        <a 
          href="https://chat.whatsapp.com/CXGZwp4tcdR5TwXFp53lye?s=cl&p=a&ilr=1" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display:'inline-block',
            padding:'14px 35px',
            background:'white',
            color:'#128C7E',
            textDecoration:'none',
            borderRadius:'30px',
            fontWeight:'bold',
            fontSize:'16px',
            boxShadow:'0 2px 8px rgba(0,0,0,0.2)',
            transition:'transform 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          💚 Join Authors WhatsApp Group
        </a>
        <p style={{margin:'15px 0 0',fontSize:'12px',opacity:0.85,fontStyle:'italic'}}>
          Only verified BookNaija authors • Exclusive community
        </p>
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
          <div style={{fontSize:'12px',opacity:0.8}}>Published</div>
        </div>
        <div style={{background:'linear-gradient(135deg,#fd7e14 0%,#ffc107 100%)',padding:'25px',borderRadius:'12px',color:'white',textAlign:'center'}}>
          <div style={{fontSize:'14px',opacity:0.9}}>Total Reads</div>
          <div style={{fontSize:'32px',fontWeight:'bold'}}>{data.stats?.reads || 0}</div>
          <div style={{fontSize:'12px',opacity:0.8}}>All time</div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div style={{background:'white',padding:'25px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',marginBottom:'20px'}}>
        <h3 style={{marginTop:0,color:'#333'}}>💰 Earnings Breakdown</h3>
        <div style={{background:'#f8f9fa',padding:'15px',borderRadius:'8px',marginBottom:'15px'}}>
          <p style={{margin:'0 0 10px',color:'#666'}}>
            <strong>Calculation Method:</strong>
          </p>
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
          <p style={{margin:'0 0 10px',color:'#004085'}}>
            <strong>Bank:</strong> {data.author?.bank}
          </p>
          <p style={{margin:'0 0 10px',color:'#004085'}}>
            <strong>Account:</strong> {data.author?.account}
          </p>
          <p style={{margin:0,color:'#004085'}}>
            <strong>Name:</strong> {data.author?.accountName}
          </p>
        </div>
        <p style={{marginTop:'15px',fontSize:'14px',color:'#666'}}>
          💡 Payments are processed monthly. Update your details via the author onboarding form if needed.
        </p>
      </div>
    </div>
  );
}
