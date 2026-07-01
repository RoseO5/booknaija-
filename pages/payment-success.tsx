'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
export default function PaymentSuccess() {
  const router = useRouter();
  const { reference } = router.query;
  useEffect(() => {
    if (!reference) return;
    fetch('/api/verify-payment', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ reference }) 
    })
    .then(r => r.json())
    .then(() => setTimeout(() => router.push('/books'), 3000));
  }, [reference, router]);
  return (
    <div style={{textAlign:'center',padding:'40px',fontFamily:'Arial'}}>
      <div style={{fontSize:'60px',marginBottom:'20px'}}>🎉</div>
      <h1 style={{color:'#28a745'}}>Payment Successful!</h1>
      <p style={{color:'#666',marginTop:'15px'}}>Your premium access is being activated...</p>
      <p style={{color:'#999',marginTop:'10px'}}>Redirecting to your library...</p>
      <a href="/books" style={{color:'#667eea',fontWeight:'bold',textDecoration:'none',marginTop:'20px',display:'inline-block'}}>Go to Library Now →</a>
    </div>
  );
}
