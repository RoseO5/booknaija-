'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';

export default function Upload() {
  const { data: session, status } = useSession();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [authorStatus, setAuthorStatus] = useState<{isOnboarded: boolean; checking: boolean}>({isOnboarded: false, checking: true});

  // Check if user is an onboarded author
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      fetch('/api/authors/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email })
      })
      .then(r => r.json())
      .then(data => setAuthorStatus({ isOnboarded: data.isOnboarded, checking: false }))
      .catch(() => setAuthorStatus({ isOnboarded: false, checking: false }));
    } else if (status === 'unauthenticated') {
      setAuthorStatus({ isOnboarded: false, checking: false });
    }
  }, [status, session]);

  if (status === 'loading' || authorStatus.checking) {
    return <div style={{padding:'40px',textAlign:'center'}}>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{padding:'40px',textAlign:'center',maxWidth:'500px',margin:'50px auto',fontFamily:'Arial'}}>
        <h2 style={{color:'#667eea'}}>📤 Upload Your Book</h2>
        <p style={{color:'#666',marginBottom:'20px'}}>Sign in with Google to upload books</p>
        <button onClick={() => signIn('google')} style={{padding:'12px 30px',background:'#4285f4',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'bold'}}>
          🔐 Sign in with Google
        </button>
      </div>
    );
  }

  // If not onboarded as author, redirect to onboarding
  if (!authorStatus.isOnboarded) {
    return (
      <div style={{padding:'40px',textAlign:'center',maxWidth:'500px',margin:'50px auto',fontFamily:'Arial'}}>
        <h2 style={{color:'#fd7e14'}}>✍️ Author Registration Required</h2>
        <p style={{color:'#666',marginBottom:'20px'}}>
          To upload books, you must first complete the author onboarding form with your details and bank information.
        </p>
        <a href="/author-onboarding" style={{display:'inline-block',padding:'12px 30px',background:'#fd7e14',color:'white',textDecoration:'none',borderRadius:'8px',fontWeight:'bold'}}>
          ✍️ Complete Author Registration
        </a>

        {/* Authors WhatsApp Link for Non-Onboarded Authors */}
        <div style={{marginTop:'30px', padding:'15px', background:'#e7f3ff', borderRadius:'8px'}}>
          <p style={{margin:'0 0 10px', color:'#004085', fontWeight:'bold'}}>💬 Join our Authors Community</p>
          <a href="https://chat.whatsapp.com/CXGZwp4tcdR5TwXFp53lye?mode=gi_t" target="_blank" rel="noopener noreferrer" style={{display:'inline-block', padding:'10px 20px', background:'#25D366', color:'white', textDecoration:'none', borderRadius:'6px', fontWeight:'bold'}}>
            Join Authors WhatsApp Group
          </a>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setMessage('');
    setProgress(0);
    
    const formData = new FormData(e.currentTarget);
    const pdfFile = formData.get('pdf') as File | null;

    // ✅ Client-side validation
    if (!pdfFile || !pdfFile.name) {
      setMessage('❌ Please select a PDF file');
      return;
    }
    if (pdfFile.size > 10 * 1024 * 1024) { // 10MB limit
      setMessage('❌ File is too large. Please keep it under 10MB.');
      return;
    }

    setUploading(true);
    setProgress(10); // Start progress

    try {
      // Simulate progress while waiting for server
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      const res = await fetch('/api/books/upload', {
        method: 'POST',
        body: formData
      });
      
      clearInterval(interval);
      setProgress(100);
      const result = await res.json();

      if (result.success) {
        setMessage('✅ ' + (result.message || 'Book uploaded! Pending admin approval.'));
        setTimeout(() => window.location.href = '/books', 2000);
      } else {
        setMessage('❌ ' + (result.error || 'Upload failed'));
      }
    } catch (err: any) {
      setMessage('❌ Connection lost. Please check your internet and try again. If the file is large, try using Wi-Fi.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{padding:'20px',maxWidth:'500px',margin:'0 auto',fontFamily:'Arial'}}>
      <h1 style={{color:'#667eea',textAlign:'center'}}>📤 Upload Your Book</h1>
      <div style={{background:'#d4edda',padding:'10px',borderRadius:'8px',marginBottom:'15px',fontSize:'13px',color:'#155724',textAlign:'center'}}>
        ✅ Welcome, {session?.user?.name}! Your uploads go to admin for approval.
      </div>

      {message && (
        <div style={{margin:'10px 0',padding:'12px',background:message.includes('✅')?'#d4edda':'#f8d7da',color:message.includes('✅')?'#155724':'#721c24',borderRadius:'4px'}}>
          {message}
        </div>
      )}

      {uploading && (
        <div style={{margin:'10px 0'}}>
          <div style={{background:'#eee',borderRadius:'4px',height:'10px',width:'100%'}}>
            <div style={{background:'#28a745',height:'100%',width:`${progress}%`,transition:'width 0.3s'}}></div>
          </div>
          <p style={{fontSize:'12px',color:'#666',textAlign:'center'}}>Uploading to Cloudflare... {progress}%</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="Book Title *" required style={{width:'100%',margin:'8px 0',padding:'10px',border:'1px solid #ddd',borderRadius:'4px'}} />
        <input name="authorName" placeholder="Author Name *" required style={{width:'100%',margin:'8px 0',padding:'10px',border:'1px solid #ddd',borderRadius:'4px'}} />
        
        <label style={{display:'block', margin:'8px 0', color:'#666', fontSize:'14px', fontWeight:'bold'}}>🖼️ Book Cover (Image):</label>
        <input name="cover" type="file" accept="image/*" style={{width:'100%',margin:'8px 0',padding:'10px',border:'1px solid #ddd',borderRadius:'4px'}} />
        
        <label style={{display:'block', margin:'8px 0', color:'#666', fontSize:'14px', fontWeight:'bold'}}>📄 Book Content (PDF) *</label>
        <input name="pdf" type="file" accept=".pdf" required style={{width:'100%',margin:'8px 0',padding:'10px',border:'1px solid #ddd',borderRadius:'4px'}} />
        
        <button type="submit" disabled={uploading} style={{width:'100%',padding:'12px',background:uploading?'#999':'#28a745',color:'white',border:'none',borderRadius:'4px',fontWeight:'bold',cursor:'pointer'}}>
          {uploading ? '⏳ Uploading...' : '📤 Upload Book'}
        </button>
      </form>

      {/* Authors WhatsApp Link for Onboarded Authors */}
      <div style={{marginTop:'30px', padding:'15px', background:'#e7f3ff', borderRadius:'8px', textAlign:'center'}}>
        <p style={{margin:'0 0 10px', color:'#004085', fontWeight:'bold'}}>💬 Connect with other Authors</p>
        <a href="https://chat.whatsapp.com/CXGZwp4tcdR5TwXFp53lye?mode=gi_t" target="_blank" rel="noopener noreferrer" style={{display:'inline-block', padding:'10px 20px', background:'#25D366', color:'white', textDecoration:'none', borderRadius:'6px', fontWeight:'bold'}}>
          Join Authors WhatsApp Group
        </a>
      </div>
    </div>
  );
}
