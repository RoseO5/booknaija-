'use client';
import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';

export default function AuthorOnboarding() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    fullName: '', location: '', state: '', bankName: '', 
    accountNumber: '', accountName: '', phoneNumber: '', agreedToTerms: false
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (status === 'loading') return <div style={{padding:'40px',textAlign:'center'}}>Loading...</div>;

  if (status === 'unauthenticated') {
    return (
      <div style={{padding:'40px',textAlign:'center',maxWidth:'500px',margin:'50px auto',fontFamily:'Arial'}}>
        <h2 style={{color:'#667eea'}}>✍️ Author Registration</h2>
        <p style={{color:'#666',marginBottom:'20px'}}>Sign in with Google to start your author onboarding</p>
        <button onClick={() => signIn('google')} style={{padding:'12px 30px',background:'#4285f4',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'bold'}}>
          🔐 Sign in with Google
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.agreedToTerms) {
      setMessage('❌ You must agree to the compliance terms');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/authors/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, email: session?.user?.email })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ ' + data.message);
        setTimeout(() => window.location.href = '/upload', 2000);
      } else {
        setMessage('❌ ' + data.error);
      }
    } catch (err) {
      setMessage('❌ Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div style={{padding:'20px',maxWidth:'600px',margin:'0 auto',fontFamily:'Arial'}}>
      <h1 style={{color:'#667eea',textAlign:'center'}}>✍️ Author Onboarding</h1>
      <p style={{textAlign:'center',color:'#666',marginBottom:'20px'}}>
        Complete your profile to start uploading books
      </p>

      {message && (
        <div style={{padding:'12px',background:message.includes('✅')?'#d4edda':'#f8d7da',color:message.includes('✅')?'#155724':'#721c24',borderRadius:'8px',marginBottom:'15px'}}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{background:'white',padding:'25px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)'}}>
        <h3 style={{marginTop:0,color:'#333'}}>👤 Personal Information</h3>
        <input name="fullName" placeholder="Full Name *" required value={formData.fullName} onChange={handleChange} style={{width:'100%',padding:'10px',margin:'5px 0',border:'1px solid #ddd',borderRadius:'6px'}} />
        <input name="phoneNumber" placeholder="Phone Number *" required value={formData.phoneNumber} onChange={handleChange} style={{width:'100%',padding:'10px',margin:'5px 0',border:'1px solid #ddd',borderRadius:'6px'}} />
        <input name="location" placeholder="City/Town *" required value={formData.location} onChange={handleChange} style={{width:'100%',padding:'10px',margin:'5px 0',border:'1px solid #ddd',borderRadius:'6px'}} />
        <select name="state" required value={formData.state} onChange={handleChange} style={{width:'100%',padding:'10px',margin:'5px 0',border:'1px solid #ddd',borderRadius:'6px'}}>
          <option value="">Select State *</option>
          <option>Abia</option><option>Adamawa</option><option>Akwa Ibom</option><option>Anambra</option>
          <option>Bauchi</option><option>Bayelsa</option><option>Benue</option><option>Borno</option>
          <option>Cross River</option><option>Delta</option><option>Ebonyi</option><option>Edo</option>
          <option>Ekiti</option><option>Enugu</option><option>FCT</option><option>Gombe</option>
          <option>Imo</option><option>Jigawa</option><option>Kaduna</option><option>Kano</option>
          <option>Katsina</option><option>Kebbi</option><option>Kogi</option><option>Kwara</option>
          <option>Lagos</option><option>Nasarawa</option><option>Niger</option><option>Ogun</option>
          <option>Ondo</option><option>Osun</option><option>Oyo</option><option>Plateau</option>
          <option>Rivers</option><option>Sokoto</option><option>Taraba</option><option>Yobe</option>
          <option>Zamfara</option>
        </select>

        <h3 style={{marginTop:'20px',color:'#333'}}>💰 Payment Details (For Earnings)</h3>
        <select name="bankName" required value={formData.bankName} onChange={handleChange} style={{width:'100%',padding:'10px',margin:'5px 0',border:'1px solid #ddd',borderRadius:'6px'}}>
          <option value="">Select Bank *</option>
          <option>Access Bank</option><option>First Bank</option><option>GTBank</option>
          <option>UBA</option><option>Zenith Bank</option><option>Kuda Bank</option>
          <option>Opay</option><option>Palmpay</option><option>Stanbic IBTC</option>
          <option>Sterling Bank</option><option>Wema Bank</option><option>Other</option>
        </select>
        <input name="accountNumber" placeholder="Account Number (10 digits) *" required maxLength={10} pattern="\d{10}" value={formData.accountNumber} onChange={handleChange} style={{width:'100%',padding:'10px',margin:'5px 0',border:'1px solid #ddd',borderRadius:'6px'}} />
        <input name="accountName" placeholder="Account Name *" required value={formData.accountName} onChange={handleChange} style={{width:'100%',padding:'10px',margin:'5px 0',border:'1px solid #ddd',borderRadius:'6px'}} />

        <h3 style={{marginTop:'20px',color:'#333'}}>📜 Compliance Agreement</h3>
        <div style={{background:'#f8f9fa',padding:'15px',borderRadius:'8px',fontSize:'13px',color:'#666',marginBottom:'10px'}}>
          By registering as an author, you agree to:
          <ul style={{marginTop:'8px',paddingLeft:'20px'}}>
            <li>Only upload content you own or have rights to</li>
            <li>Not upload pirated, plagiarized, or illegal content</li>
            <li>Comply with Nigerian copyright laws</li>
            <li>Allow BookNaija to moderate your content</li>
            <li>Accept that earnings are paid monthly via bank transfer</li>
          </ul>
        </div>
        <label style={{display:'flex',alignItems:'center',gap:'8px',margin:'15px 0',fontWeight:'bold'}}>
          <input type="checkbox" name="agreedToTerms" checked={formData.agreedToTerms} onChange={handleChange} required />
          I agree to the Terms of Service and Compliance Policy *
        </label>

        <button type="submit" disabled={loading} style={{width:'100%',padding:'12px',background:loading?'#999':'#fd7e14',color:'white',border:'none',borderRadius:'8px',fontWeight:'bold',cursor:'pointer',marginTop:'10px'}}>
          {loading ? '⏳ Processing...' : '✅ Complete Registration'}
        </button>
      </form>
    </div>
  );
}
