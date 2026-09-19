'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function TriviaPage() {
  const { data: session, status } = useSession();
  const isSubscribed = session?.user?.subscription?.active;
  const router = useRouter();
  const [tournament, setTournament] = useState<any>(null);
  const [featuredBooks, setFeaturedBooks] = useState<any[]>([]);
  const [userCoins, setUserCoins] = useState<number | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetch(`/api/coins/balance?userId=${session.user.id}`)
        .then(r => r.json())
        .then(data => setUserCoins(data.balance ?? 0))
        .catch(() => {});

      fetch(`/api/trivia/status?month=${currentMonth}`)
        .then(r => r.json())
        .then(data => {
          setTournament(data.tournament);
          setFeaturedBooks(data.featuredBooks || []);
        })
        .catch(() => {});
    }
  }, [status, session, currentMonth]);

  const handleBuyCoins = async () => {
    if (!session?.user?.id || !session?.user?.email) {
      alert('❌ Please log in to buy coins.');
      return;
    }
    setIsBuying(true);
    try {
      const res = await fetch('/api/coins/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, email: session.user.email })
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert('❌ Error: ' + (data.error || 'Failed to initialize payment'));
        setIsBuying(false);
      }
    } catch (err) {
      alert('❌ Network error. Please try again.');
      setIsBuying(false);
    }
  };

  const handleEnter = async () => {
    if (!session?.user) return;
    
    const alreadyEntered = tournament?.players?.some((p: any) => p.userId === session.user.id);
    if (alreadyEntered) {
      alert('ℹ️ You have already entered this month\'s tournament!');
      return;
    }

    if (!isSubscribed) {
      alert('🔒 Trivia is exclusively for subscribed readers. Please subscribe to enter!');
      router.push('/books');
      return;
    }
    if ((userCoins || 0) < 100) {
      alert('❌ You need 100 coins to enter. Please buy coins first!');
      router.push('/books');
      return;
    }

    if (!confirm('🎯 Enter Monthly Trivia for 100 coins?\n\nTop 3 winners share huge cash prizes!')) return;

    setIsEntering(true);
    try {
      const res = await fetch('/api/trivia/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          userName: session.user.name,
          userEmail: session.user.email
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserCoins(data.newBalance);
        alert(data.message);
        router.push('/trivia/quiz');
      } else {
        alert('❌ ' + (data.error || 'Failed to enter'));
      }
    } catch (err) {
      alert('❌ Network error. Please try again.');
    } finally {
      setIsEntering(false);
    }
  };

  if (status === 'loading') return <div style={{padding:'40px',textAlign:'center'}}>Loading...</div>;

  const alreadyEntered = tournament?.players?.some((p: any) => p.userId === session?.user?.id);

  return (
    <div style={{padding:'20px',maxWidth:'800px',margin:'0 auto',fontFamily:'Arial'}}>
      <button onClick={() => router.push('/')} style={{marginBottom:'20px',padding:'8px 16px',background:'#f1f1f1',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'bold'}}>← Back</button>
      
      <div style={{textAlign:'center',marginBottom:'30px'}}>
        <h1 style={{color:'#667eea',fontSize:'32px',marginBottom:'10px'}}>🏆 Monthly Trivia Tournament</h1>
        <p style={{color:'#666',fontSize:'18px'}}>Test your knowledge, win cash prizes, and support Nigerian authors!</p>
      </div>

      {/* LIVE PRIZE POOL */}
      <div style={{background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',padding:'30px',borderRadius:'16px',color:'white',textAlign:'center',marginBottom:'30px',boxShadow:'0 8px 24px rgba(102,126,234,0.3)'}}>
        <div style={{fontSize:'14px',opacity:0.9,marginBottom:'10px'}}>CURRENT PRIZE POOL</div>
        <div style={{fontSize:'48px',fontWeight:'bold',marginBottom:'10px'}}>₦{tournament?.totalPoolNaira?.toLocaleString() || 0}</div>
        <div style={{fontSize:'16px',opacity:0.95}}>{tournament?.totalPlayers || 0} players entered</div>
      </div>

      {/* PRIZE BREAKDOWN */}
      <div style={{background:'white',padding:'25px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',marginBottom:'30px'}}>
        <h3 style={{marginTop:0,color:'#333',marginBottom:'20px'}}>💰 Prize Breakdown</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:'15px'}}>
          <div style={{background:'#fff3cd',padding:'15px',borderRadius:'8px',textAlign:'center',border:'2px solid #ffc107'}}>
            <div style={{fontSize:'24px',marginBottom:'5px'}}>🥇</div>
            <div style={{fontSize:'12px',color:'#666'}}>1st Place</div>
            <div style={{fontSize:'20px',fontWeight:'bold',color:'#856404'}}>₦{tournament?.prizes?.first?.toLocaleString() || 0}</div>
          </div>
          <div style={{background:'#e7f3ff',padding:'15px',borderRadius:'8px',textAlign:'center',border:'2px solid #b8daff'}}>
            <div style={{fontSize:'24px',marginBottom:'5px'}}>🥈</div>
            <div style={{fontSize:'12px',color:'#666'}}>2nd Place</div>
            <div style={{fontSize:'20px',fontWeight:'bold',color:'#004085'}}>₦{tournament?.prizes?.second?.toLocaleString() || 0}</div>
          </div>
          <div style={{background:'#f8d7da',padding:'15px',borderRadius:'8px',textAlign:'center',border:'2px solid #f5c6cb'}}>
            <div style={{fontSize:'24px',marginBottom:'5px'}}>🥉</div>
            <div style={{fontSize:'12px',color:'#666'}}>3rd Place</div>
            <div style={{fontSize:'20px',fontWeight:'bold',color:'#721c24'}}>₦{tournament?.prizes?.third?.toLocaleString() || 0}</div>
          </div>
        </div>
        <div style={{marginTop:'15px',padding:'15px',background:'#d4edda',borderRadius:'8px',textAlign:'center'}}>
          <div style={{fontSize:'14px',color:'#155724'}}>✍️ 5 Featured Authors also share ₦{tournament?.prizes?.authors?.toLocaleString() || 0}</div>
        </div>
      </div>

      {/* FEATURED BOOKS */}
      <div style={{background:'white',padding:'25px',borderRadius:'12px',boxShadow:'0 2px 10px rgba(0,0,0,0.1)',marginBottom:'30px'}}>
        <h3 style={{marginTop:0,color:'#333',marginBottom:'20px'}}>📚 This Month's Featured Books</h3>
        <p style={{color:'#666',fontSize:'14px',marginBottom:'15px'}}>
          Questions will be based on these books. Read them to increase your chances of winning!
        </p>
        {featuredBooks.length === 0 ? (
          <p style={{color:'#999',textAlign:'center',padding:'20px'}}>No books featured yet. Check back soon!</p>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:'15px'}}>
            {featuredBooks.map((book, i) => (
              <div key={i} style={{background:'#f8f9fa',padding:'15px',borderRadius:'8px',borderLeft:'4px solid #667eea'}}>
                <div style={{fontWeight:'bold',color:'#333',marginBottom:'5px'}}>{book.title}</div>
                <div style={{fontSize:'13px',color:'#666'}}>by {book.authorName}</div>
                <div style={{fontSize:'12px',color:'#667eea',marginTop:'5px'}}>{book.questionCount} questions</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ENTER BUTTON */}
      <div style={{textAlign:'center'}}>
        {alreadyEntered ? (
          <div style={{background:'#d4edda',padding:'20px',borderRadius:'12px',color:'#155724'}}>
            <div style={{fontSize:'18px',fontWeight:'bold',marginBottom:'10px'}}>✅ You're In!</div>
            <p style={{margin:0}}>You have already entered this month's tournament. Good luck!</p>
            <button
              onClick={() => router.push('/trivia/quiz')}
              style={{marginTop:'15px',padding:'12px 30px',background:'#28a745',color:'white',border:'none',borderRadius:'8px',fontWeight:'bold',fontSize:'16px',cursor:'pointer'}}
            >
              📝 Start Quiz Now
            </button>
          </div>
        ) : (
          <div>
            {!isSubscribed ? (
              <div style={{background:'#fff3cd',padding:'20px',borderRadius:'12px',border:'2px solid #ffc107',textAlign:'center'}}>
                <div style={{fontSize:'48px',marginBottom:'10px'}}>🔒</div>
                <h3 style={{color:'#856404',marginBottom:'10px'}}>Premium Feature</h3>
                <p style={{color:'#856404',marginBottom:'15px'}}>
                  The Monthly Trivia Tournament is exclusively for subscribed readers. 
                  Subscribe for ₦1000/month to enter, win cash prizes, and unlock all books!
                </p>
                <a href="/books" style={{display:'inline-block',padding:'12px 30px',background:'#28a745',color:'white',textDecoration:'none',borderRadius:'8px',fontWeight:'bold',fontSize:'16px'}}>
                  💳 Subscribe Now
                </a>
              </div>
            ) : (
              <div>
                <p style={{color:'#666',marginBottom:'15px'}}>
                  Your balance: <strong style={{color:'#667eea'}}>{userCoins ?? 0} coins</strong>
                </p>
                <button
                  onClick={handleEnter}
                  disabled={isEntering || (userCoins !== null && userCoins < 100)}
                  style={{
                    padding:'15px 40px',
                    background: isEntering || (userCoins !== null && userCoins < 100) ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color:'white',
                    border:'none',
                    borderRadius:'12px',
                    fontWeight:'bold',
                    fontSize:'18px',
                    cursor: isEntering || (userCoins !== null && userCoins < 100) ? 'not-allowed' : 'pointer',
                    boxShadow:'0 4px 16px rgba(102,126,234,0.4)'
                  }}
                >
                  {isEntering ? '⏳ Entering...' : '🎯 Enter Tournament (100 Coins)'}
                </button>
                {userCoins !== null && userCoins < 100 && (
                  <button
                    onClick={handleBuyCoins}
                    disabled={isBuying}
                    style={{
                      marginTop: '15px',
                      padding: '12px 24px',
                      background: isBuying ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '15px',
                      cursor: isBuying ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                      width: '100%',
                      maxWidth: '300px'
                    }}
                  >
                    {isBuying ? '⏳ Loading Paystack...' : '💳 Buy 100 Coins for ₦100 Now'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
