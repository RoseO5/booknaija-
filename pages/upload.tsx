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

  // 📜 DEBUG HELPER: Adds logs to screen AND browser console
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
        <p style={{color:'#666',marginBottom:'20px'}}>
          To upload books, you must first complete the author onboarding form.
        </p>
        <a href="/author-onboarding" style={{display:'inline-block',padding:'12px 30px',background:'#fd7e14',color:'white',textDecoration:'none',borderRadius:'8px',fontWeight:'bold'}}>
          ✍️ Complete Author Registration
        </a>
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
    setStep('1. Checking files...');
    setUploading(true);
    setLogs([]); // Clear previous logs
    addLog('🚀 Starting upload process');

    const formData = new FormData(e.currentTarget);
    const pdfFile = formData.get('pdf') as File;
    const coverFile = formData.get('cover') as File;
    const title = formData.get('title') as string;
    const authorName = formData.get('authorName') as string;

    addLog(`📝 Form data: Title="${title}", PDF=${!!pdfFile}, Cover=${!!coverFile}`);

    if (!pdfFile || !pdfFile.name) {
      addLog('❌ No PDF file selected');
      setMessage('❌ Please select a PDF file');
      setUploading(false);
      setStep('');
      return;
    }

    // ✅ File Size Validation
    const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20MB
    const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB

    if (pdfFile.size > MAX_PDF_SIZE) {
      addLog(`❌ PDF too large: ${pdfFile.size} bytes`);
      setMessage(`❌ PDF is too large (${(pdfFile.size / 1024 / 1024).toFixed(1)}MB). Maximum is 20MB.`);
      setUploading(false);
      setStep('');
      return;
    }

    if (coverFile && coverFile.size > MAX_COVER_SIZE) {
      addLog(`❌ Cover too large: ${coverFile.size} bytes`);
      setMessage(`❌ Cover image is too large (${(coverFile.size / 1024 / 1024).toFixed(1)}MB). Maximum is 5MB.`);
      setUploading(false);
      setStep('');
      return;
    }

    try {
      let finalCoverUrl = '';

      // STEP 1: Upload Cover DIRECTLY to Cloudinary (True Selar Method)
      if (coverFile && coverFile.name) {
        addLog('🖼️ Starting Cloudinary upload');
        setStep('2. Getting Cloudinary signature...');
        
        try {
          const sigRes = await fetch('/api/get-cloudinary-signature');
          addLog(`✅ Signature response: ${sigRes.status}`);
          const sigData = await sigRes.json();
          addLog(`✅ Got signature for ${sigData.cloud_name}`);

          setStep('3. Uploading Cover directly to Cloudinary...');
          const coverFormData = new FormData();
          coverFormData.append('file', coverFile);
          coverFormData.append('api_key', sigData.api_key);
          coverFormData.append('timestamp', sigData.timestamp);
          coverFormData.append('signature', sigData.signature);
          coverFormData.append('folder', sigData.folder);

          const coverRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`, {
            method: 'POST',
            body: coverFormData
          });

          addLog(`✅ Cloudinary response: ${coverRes.status}`);

          if (!coverRes.ok) throw new Error('Cover upload to Cloudinary failed');
          const coverResult = await coverRes.json();
          finalCoverUrl = coverResult.secure_url;
          addLog('✅ Cover uploaded to Cloudinary');
        } catch (coverErr: any) {
          addLog(`❌ Cloudinary error: ${coverErr.message}`);
          throw coverErr;
        }
      }

      // STEP 2: Upload PDF DIRECTLY to Cloudflare R2
      addLog('📄 Starting R2 upload');
      setStep('4. Getting R2 link...');
      const urlRes = await fetch(`/api/get-upload-url?filename=${encodeURIComponent(pdfFile.name)}`);
      addLog(`✅ R2 URL response: ${urlRes.status}`);
      const urlData = await urlRes.json();
      addLog('✅ Got R2 upload link');

      if (!urlData.uploadUrl) throw new Error('Failed to get R2 upload link.');

      setStep('5. Uploading PDF directly to Cloudflare...');
      const directUpload = await fetch(urlData.uploadUrl, {
        method: 'PUT',
        body: pdfFile,
        headers: { 'Content-Type': 'application/pdf' }
      });

      addLog(`✅ R2 upload response: ${directUpload.status}`);
      if (!directUpload.ok) throw new Error('PDF upload to Cloudflare failed');
      addLog('✅ PDF uploaded to Cloudflare R2');

      // STEP 3: Send ONLY text links to backend (MongoDB)
      addLog('💾 Starting MongoDB save');
      setStep('6. Saving book details to database...');
      
      const payload = {
        title,
        authorName,
        pdfUrl: urlData.publicUrl,
        coverUrl: finalCoverUrl
      };
      addLog(`📝 Payload: ${JSON.stringify(payload).substring(0, 100)}...`);

      const res = await fetch('/api/books/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
        setTimeout(() => window.location.href = '/books', 2000);
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
          {uploading ? '⏳ Processing...' : '📤 Upload Book'}
        </button>
      </form>

      {/* 📜 DEBUG LOG BOX FOR MOBILE */}
      <div style={{marginTop:'20px', padding:'10px', background:'#1e1e1e', color:'#00ff00', fontFamily:'monospace', fontSize:'11px', maxHeight:'300px', overflowY:'scroll', borderRadius:'8px', whiteSpace:'pre-wrap', border:'1px solid #333'}}>
        <strong style={{color:'#fff'}}>📜 Debug Logs (Scroll & Copy to me):</strong>
        {'\n'}
        {logs.length === 0 ? 'Waiting for upload...' : logs.join('\n')}
      </div>

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
