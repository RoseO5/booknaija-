'use client';

import { useState } from 'react';

export default function Admin() {
  // Authentication state
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Login screen (shown first)
  if (!authenticated) {
    const handleLogin = async (e: any) => {
      e.preventDefault();
      const res = await fetch('/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await res.json();
      if (result.valid) {
        setAuthenticated(true);
      } else {
        setLoginError('❌ Incorrect password');
        setTimeout(() => setLoginError(''), 2000);
      }
    };
    return (
      <div style={{ padding: '30px', maxWidth: '400px', margin: '100px auto', fontFamily: 'Arial' }}>
        <h2 style={{ color: '#667eea', textAlign: 'center' }}>🔐 Admin Login</h2>
        {loginError && <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{loginError}</div>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="Enter admin password" required style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }} />
          <button type="submit" style={{ padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Login</button>
        </form>
      </div>
    );
  }

  // === YOUR EXISTING CODE STARTS HERE (unchanged) ===
  const [uploading, setUploading] = useState(false);
  const [debugLog, setDebugLog] = useState('');
  const [message, setMessage] = useState('');

  const log = (msg: string) => {
    console.log(msg);
    setDebugLog(prev => prev + msg + '\n');
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pdfFile = formData.get('pdf') as File | null;
    
    setUploading(true);
    setMessage('');
    setDebugLog('');

    if (!pdfFile || !pdfFile.name) {
      setMessage('❌ No PDF file selected');
      return;
    }

    const fileSize = pdfFile.size;
    const fileName = pdfFile.name;
    log(`📄 File: ${fileName}`);
    log(`📦 Size: ${(fileSize / 1024).toFixed(1)} KB`);
    log(`📡 Starting upload to /api/books/upload...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch('/api/books/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      log(`✅ Response received - Status: ${res.status}`);

      if (!res.ok) {
        const errorText = await res.text();
        log(`❌ Server error response: ${errorText.substring(0, 200)}`);
        throw new Error(`HTTP ${res.status}: ${errorText.substring(0, 100)}`);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        log(`⚠️ Non-JSON response: ${text.substring(0, 200)}`);
        throw new Error('Server returned non-JSON response');
      }

      const result = await res.json();
      log(`📤 Result: ${JSON.stringify(result, null, 2)}`);

      if (result.success) {
        setMessage('✅ SUCCESS! Book uploaded!');
        setTimeout(() => window.location.href = '/books', 2000);
      } else {
        setMessage(`❌ SERVER ERROR: ${result.error || result.details || 'Unknown'}`);
      }
    } catch (err: any) {
      log(`💥 Upload failed: ${err.name || 'Error'} - ${err.message || 'No details'}`);
      
      if (err.name === 'AbortError') {
        setMessage('❌ TIMEOUT: Upload took too long. Try smaller file or better signal.');
        log('⏰ Upload timed out after 20 seconds');
      } else if (err.message?.includes('fetch')) {
        setMessage('❌ NETWORK ERROR: Connection lost. Check signal and retry.');
        log('📶 Network connection failed during upload');
      } else if (err.message?.includes('Failed to fetch')) {
        setMessage('❌ CONNECTION REFUSED: API not reachable. Check Vercel deployment.');
        log('🔌 Could not connect to API endpoint');
      } else {
        setMessage(`❌ ERROR: ${err.message || 'Upload failed'}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1 style={{ textAlign: 'center', color: '#667eea' }}>➕ Upload Book (Debug Mode)</h1>
      
      {debugLog && (
        <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px', padding: '12px', marginBottom: '15px', maxHeight: '200px', overflowY: 'auto', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
          <strong>📱 DEBUG LOG:</strong><br/>{debugLog}
        </div>
      )}
      
      {message && (
        <div style={{ margin: '10px 0', padding: '12px', background: message.includes('✅') ? '#d4edda' : '#f8d7da', borderLeft: `4px solid ${message.includes('✅') ? '#28a745' : '#dc3545'}`, borderRadius: '4px' }}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input name="title" placeholder="Title *" required style={{ width: '100%', margin: '8px 0', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
        <input name="authorName" placeholder="Author *" required style={{ width: '100%', margin: '8px 0', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
        <input name="pdf" type="file" accept=".pdf" required style={{ width: '100%', margin: '8px 0', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
        <button type="submit" disabled={uploading} style={{ width: '100%', padding: '12px', background: uploading ? '#6c757d' : '#667eea', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer' }}>
          {uploading ? '📤 Uploading...' : '📤 Upload Book'}
        </button>
      </form>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', padding: '10px', background: '#fff3cd', borderRadius: '4px' }}>
        <strong>💡 Mobile Tips:</strong><br/>
        • Watch DEBUG LOG above for real-time info<br/>
        • Keep screen ON during upload<br/>
        • Use PDF under 100KB<br/>
        • Wait for 3+ signal bars
      </div>
    </div>
  );
}
