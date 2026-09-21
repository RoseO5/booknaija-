'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function TriviaQuiz() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: string}>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const timerRef = useRef<any>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const TOTAL_TIME = 1200; // 20 minutes

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetch(`/api/trivia/quiz-questions?month=${currentMonth}&userId=${session.user.id}`)
        .then(r => r.json())
        .then(data => {
          setLoading(false);
          if (!data.hasEntered) {
            setError('You must enter the tournament first!');
            setTimeout(() => router.push('/trivia'), 2000);
            return;
          }
          if (data.alreadyCompleted) {
            setResult({
              alreadyCompleted: true,
              score: data.previousScore
            });
            return;
          }
          if (data.noQuestionsAvailable || data.questions.length === 0) {
            setError('No questions available yet. Authors are still submitting questions. Check back soon!');
            return;
          }
          setQuestions(data.questions);
          setStartTime(Date.now());
        })
        .catch(() => {
          setLoading(false);
          setError('Failed to load quiz');
        });
    }
  }, [status, session, currentMonth, router]);

  // COUNTDOWN TIMER
  useEffect(() => {
    if (startTime > 0 && !result && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up! Auto-submit
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [startTime, result]);

  const handleAutoSubmit = async () => {
    if (!session?.user?.id || questions.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const answersArray = questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id] || ''
      }));

      const res = await fetch('/api/trivia/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          answers: answersArray,
          completionTime: TOTAL_TIME // They used all their time
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
      } else {
        alert('❌ ' + (data.error || 'Failed to submit'));
      }
    } catch (err) {
      alert('❌ Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!session?.user?.id) return;
    
    const unanswered = questions.filter(q => !answers[q.id] || !answers[q.id].trim());
    if (unanswered.length > 0) {
      if (!confirm(`⚠️ You have ${unanswered.length} unanswered question(s). Submit anyway?`)) {
        return;
      }
    }

    if (!confirm('📝 Submit your answers? You cannot change them after this.')) {
      return;
    }

    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    try {
      const completionTime = TOTAL_TIME - timeLeft;
      const answersArray = questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id] || ''
      }));

      const res = await fetch('/api/trivia/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          answers: answersArray,
          completionTime
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
      } else {
        alert('❌ ' + (data.error || 'Failed to submit'));
      }
    } catch (err) {
      alert('❌ Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeLow = timeLeft <= 120; // 2 minutes or less
  const isTimeCritical = timeLeft <= 60; // 1 minute or less

  if (status === 'loading' || loading) {
    return <div style={{padding:'40px',textAlign:'center'}}>Loading quiz...</div>;
  }

  if (error) {
    return (
      <div style={{padding:'40px',textAlign:'center',maxWidth:'600px',margin:'0 auto'}}>
        <div style={{fontSize:'64px',marginBottom:'20px'}}>⚠️</div>
        <h2 style={{color:'#856404'}}>{error}</h2>
        <button onClick={() => router.push('/trivia')} style={{marginTop:'20px',padding:'12px 30px',background:'#667eea',color:'white',border:'none',borderRadius:'8px',fontWeight:'bold',cursor:'pointer'}}>
          ← Back to Tournament
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div style={{padding:'20px',maxWidth:'600px',margin:'0 auto',fontFamily:'Arial',textAlign:'center'}}>
        <div style={{background:'linear-gradient(135deg, #28a745 0%, #20c997 100%)',padding:'40px',borderRadius:'16px',color:'white',marginBottom:'20px'}}>
          <div style={{fontSize:'64px',marginBottom:'10px'}}>🎉</div>
          <h2 style={{margin:'0 0 10px'}}>Quiz Completed!</h2>
          {result.alreadyCompleted ? (
            <p style={{margin:0,fontSize:'18px'}}>You previously scored: {result.score} correct answers</p>
          ) : (
            <>
              <div style={{fontSize:'48px',fontWeight:'bold',margin:'20px 0'}}>
                {result.score} / {result.totalQuestions}
              </div>
              <p style={{margin:'10px 0',fontSize:'18px'}}>
                Your Rank: <strong>#{result.rank}</strong> out of {result.totalFinished} players
              </p>
              <p style={{margin:'10px 0',fontSize:'14px',opacity:0.9}}>
                {result.rank <= 3 ? '🏆 You made it to the top 3! Stay tuned for results!' : 'Keep practicing for next month\'s tournament!'}
              </p>
            </>
          )}
        </div>
        <button onClick={() => router.push('/trivia')} style={{padding:'12px 30px',background:'#667eea',color:'white',border:'none',borderRadius:'8px',fontWeight:'bold',cursor:'pointer'}}>
          ← Back to Tournament
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div style={{padding:'20px',maxWidth:'700px',margin:'0 auto',fontFamily:'Arial'}}>
      {/* Header with Timer */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px',flexWrap:'wrap',gap:'10px'}}>
        <button onClick={() => router.push('/trivia')} style={{padding:'8px 16px',background:'#f1f1f1',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'bold'}}>
          ← Exit
        </button>
        <div style={{
          fontSize:'24px',
          fontWeight:'bold',
          color: isTimeCritical ? '#dc3545' : isTimeLow ? '#fd7e14' : '#667eea',
          background: isTimeCritical ? '#f8d7da' : isTimeLow ? '#fff3cd' : '#e7f3ff',
          padding:'8px 20px',
          borderRadius:'8px',
          border: isTimeCritical ? '2px solid #dc3545' : isTimeLow ? '2px solid #fd7e14' : '2px solid #667eea',
          animation: isTimeCritical ? 'pulse 1s infinite' : 'none'
        }}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Time Warning */}
      {isTimeLow && !isTimeCritical && (
        <div style={{background:'#fff3cd',padding:'12px',borderRadius:'8px',marginBottom:'15px',textAlign:'center',border:'2px solid #ffc107'}}>
          <strong style={{color:'#856404'}}>⚠️ Only {Math.floor(timeLeft / 60)} minutes left!</strong>
        </div>
      )}
      {isTimeCritical && (
        <div style={{background:'#f8d7da',padding:'12px',borderRadius:'8px',marginBottom:'15px',textAlign:'center',border:'2px solid #dc3545'}}>
          <strong style={{color:'#721c24'}}>🚨 FINAL MINUTE! Submit your answers now!</strong>
        </div>
      )}

      {/* Progress Bar */}
      <div style={{marginBottom:'20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px',fontSize:'14px',color:'#666'}}>
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div style={{width:'100%',height:'8px',background:'#e0e0e0',borderRadius:'4px',overflow:'hidden'}}>
          <div style={{width:`${progress}%`,height:'100%',background:'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',transition:'width 0.3s'}}></div>
        </div>
      </div>

      {/* Question Card */}
      <div style={{background:'white',padding:'30px',borderRadius:'12px',boxShadow:'0 4px 16px rgba(0,0,0,0.1)',marginBottom:'20px'}}>
        <div style={{fontSize:'12px',color:'#667eea',fontWeight:'bold',marginBottom:'10px',textTransform:'uppercase'}}>
          📚 From: {currentQuestion.bookTitle} by {currentQuestion.authorName}
        </div>
        <h2 style={{color:'#333',marginBottom:'20px',fontSize:'20px',lineHeight:'1.5'}}>
          {currentQuestion.question}
        </h2>
        <input
          type="text"
          placeholder="Type your answer here..."
          value={answers[currentQuestion.id] || ''}
          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
          style={{
            width:'100%',
            padding:'15px',
            fontSize:'16px',
            border:'2px solid #ddd',
            borderRadius:'8px',
            boxSizing:'border-box',
            outline:'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = '#ddd'}
        />
      </div>

      {/* Navigation */}
      <div style={{display:'flex',justifyContent:'space-between',gap:'10px'}}>
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          style={{
            padding:'12px 24px',
            background: currentIndex === 0 ? '#ccc' : '#6c757d',
            color:'white',
            border:'none',
            borderRadius:'8px',
            fontWeight:'bold',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          ← Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding:'12px 30px',
              background: isSubmitting ? '#ccc' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              color:'white',
              border:'none',
              borderRadius:'8px',
              fontWeight:'bold',
              fontSize:'16px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow:'0 4px 12px rgba(40,167,69,0.3)'
            }}
          >
            {isSubmitting ? '⏳ Submitting...' : '✅ Submit Quiz'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            style={{
              padding:'12px 24px',
              background:'#667eea',
              color:'white',
              border:'none',
              borderRadius:'8px',
              fontWeight:'bold',
              cursor:'pointer'
            }}
          >
            Next →
          </button>
        )}
      </div>

      {/* CSS Animation for Critical Time */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
