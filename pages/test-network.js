import { useEffect, useState } from 'react';

export default function TestNetwork() {
  const [status, setStatus] = useState('Testing network... Please wait.');

  useEffect(() => {
    fetch('/api/test-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'Hello from GLO!' })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) setStatus('✅ SUCCESS! POST requests are working perfectly on this network.');
      else setStatus('❌ Server replied, but with an error: ' + JSON.stringify(data));
    })
    .catch(err => {
      console.error(err);
      setStatus('💥 FAILED TO FETCH! This means GLO, Data Saver, or an AdBlocker is blocking POST requests.');
    });
  }, []);

  return (
    <div style={{padding:'40px', textAlign:'center', fontFamily:'Arial', maxWidth:'600px', margin:'0 auto'}}>
      <h1 style={{color:'#667eea'}}>📡 Network Diagnostic Test</h1>
      <p style={{fontSize:'18px', marginTop:'20px', padding:'20px', background:'#f8f9fa', borderRadius:'8px'}}>{status}</p>
      <p style={{color:'#666', marginTop:'20px'}}>This page tests if your mobile network allows POST requests to Vercel.</p>
    </div>
  );
}
