'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';

export default function Upload() {
  const { data: session, status } = useSession();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [authorStatus, setAuthorStatus] = useState<{isOnboarded: boolean; checking: boolean}>({isOnboarded: false, checking: true});

  const addLog = (msg: string) => {
    console.log(msg);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

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

  if (!authorStatus.isOnboarded) {
    return (
      <div style={{padding:'40px',textAlign:'center',maxWidth:'500px',margin:'50px auto',fontFamily:'Arial'}}>
        <h2 style={{color:'#fd7e14'}}>✍️ Author Registration Required</h2>
        <p style={{color:'#666',marginBottom:'20px'}}>To upload books, you must first complete the author onboarding form.</p>
        <a href="/author-onboarding" style={{display:'inline-block',padding:'12px 30px',background:'#fd7e14',color:'white',textDecoration:'none',borderRadius:'8px',fontWeight:'bold'}}>
          ✍️ Complete Author Registration
        </a>
      </div>
    );
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setMessage('');
    setStep('1. Preparing files...');
    setUploading(true);
    setLogs([]);
    addLog('🚀 Starting Cloudinary upload process');

    const formData = new FormData(e.currentTarget);
    const pdfFile = formData.get('pdf') as File;
    const coverFile = formData.get('cover') as File;
    const title = formData.get('title') as string;
    const authorName = formData.get('authorName') as string;

    if (!pdfFile || !pdfFile.name) {
      setMessage('❌ Please select a PDF file');
      setUploading(false);
      setStep('');
      return;
    }

    const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20MB
    const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB

    if (pdfFile.size > MAX_PDF_SIZE) {
      setMessage(`❌ PDF is too large (${(pdfFile.size / 1024 / 1024).toFixed(1)}MB). Maximum is 20MB.`);
      setUploading(false);
      setStep('');
      return;
    }

    if (coverFile && coverFile.size > MAX_COVER_SIZE) {
      setMessage(`❌ Cover image is too large (${(coverFile.size / 1024 / 1024).toFixed(1)}MB). Maximum is 5MB.`);
      setUploading(false);
      setStep('');
      return;
    }

    try {
      setStep('2. Uploading PDF and Cover to Cloudinary...');
      addLog('💾 Sending files to backend for Cloudinary upload...');

      const finalData = new FormData();
      finalData.append('title', title);
      finalData.append('authorName', authorName);
      finalData.append('pdf', pdfFile); // ✅ Send PDF file directly
      
      if (coverFile && coverFile.name) {
        finalData.append('cover', coverFile);
      }

      const res = await fetch('/api/books/upload', {
        method: 'POST',
        body: finalData
      });

      addLog(`✅ Backend response: ${res.status}`);
      if (!res.ok) {
        const errorText = await res.text();
        addLog(`❌ Backend error: ${errorText}`);
        throw new Error(`Server error ${res.status}: ${errorText}`);
      }

      const result = await res.json();
      addLog(`✅ Backend success!`);

      if (result.success) {
        setMessage('✅ ' + (result.message || 'Book uploaded successfully! Pending admin approval.'));
        setTimeout(() => window.location.href = '/books', 2500);
      } else {
        setMessage('❌ ' + (result.error || 'Upload failed'));
      }
    } catch (err: any) {
      addLog(`💥 CRITICAL ERROR: ${err.message}`);
      console.error(err);
      setMessage('❌ Error: ' + err.message + '. Please try again.');
    } finally {
      setUploading(false);
      setStep('');
      addLog('🏁 Upload process finished.');
    }
  };

  return (
    <div style={{padding:'20px',maxWidth:'500px',margin:'0 auto',fontFamily:'Arial'}}>
      <h1 style={{color:'#667eea',textAlign:'center'}}>📤 Upload Your Book</h1>
      <div style={{background:'#d4edda',padding:'10px',borderRadius:'8px',marginBottom:'15px',fontSize:'13px',color:'#155724',textAlign:'center'}}>
        ✅ Welcome, {session?.user?.name}!
      </div>

      <div style={{background:'#e7f3ff',padding:'10px',borderRadius:'8px',marginBottom:'15px',fontSize:'12px',color:'#004085', textAlign:'center'}}>
        📏 <strong>File Limits:</strong> PDF max 20MB • Cover max 5MB
      </div>

      {message && (
        <div style={{margin:'10px 0',padding:'12px',background:message.includes('✅')?'#d4edda':'#f8d7da',color:message.includes('✅')?'#155724':'#721c24',borderRadius:'4px'}}>
          {message}
        </div>
      )}

      {step && (
        <div style={{margin:'10px 0',padding:'12px',background:'#fff3cd',color:'#856404',borderRadius:'4px',textAlign:'center',fontSize:'14px'}}>
          ⏳ {step}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="Book Title *" required style={{width:'100%',margin:'8px 0',padding:'10px',border:'1px solid #ddd',borderRadius:'4px',boxSizing:'border-box'}} />
        <input name="authorName" placeholder="Author Name *" required style={{width:'100%',margin:'8px 0',padding:'10px',border:'1px solid #ddd',borderRadius:'4px',boxSizing:'border-box'}} />
        
        <label style={{display:'block', margin:'8px 0', color:'#666', fontSize:'14px', fontWeight:'bold'}}>🖼️ Book Cover (Image, max 5MB):</label>
        <input name="cover" type="file" accept="image/*" style={{width:'100%',margin:'8px 0',padding:'10px',border:'1px solid #ddd',borderRadius:'4px',boxSizing:'border-box'}} />
        
        <label style={{display:'block', margin:'8px 0', color:'#666', fontSize:'14px', fontWeight:'bold'}}>📄 Book Content (PDF, max 20MB) *</label>
        <input name="pdf" type="file" accept=".pdf" required style={{width:'100%',margin:'8px 0',padding:'10px',border:'1px solid #ddd',borderRadius:'4px',boxSizing:'border-box'}} />
        
        <button type="submit" disabled={uploading} style={{width:'100%',padding:'12px',background:uploading?'#999':'#28a745',color:'white',border:'none',borderRadius:'4px',fontWeight:'bold',cursor:'pointer',marginTop:'10px'}}>
          {uploading ? '⏳ Uploading to Cloudinary...' : '📤 Upload Book'}
        </button>
      </form>

      <div style={{marginTop:'20px', padding:'10px', background:'#1e1e1e', color:'#00ff00', fontFamily:'monospace', fontSize:'11px', maxHeight:'300px', overflowY:'scroll', borderRadius:'8px', whiteSpace:'pre-wrap', border:'1px solid #333'}}>
        <strong style={{color:'#fff'}}>📜 Debug Logs:</strong>{'\n'}
        {logs.length === 0 ? 'Waiting for upload...' : logs.join('\n')}
      </div>
    </div>
  );
}
