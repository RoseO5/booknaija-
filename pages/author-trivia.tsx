'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function AuthorTrivia() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([
    { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' },
    { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' },
    { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/authors/my-books-for-trivia?email=${session.user.email}`)
        .then(r => r.json())
        .then(data => setBooks(data.books || []))
        .catch(() => {});
    }
  }, [session]);

  const handleSelectBook = (book: any) => {
    setSelectedBook(book);
    setMessage('');
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    if (!selectedBook || !session?.user?.email) return;

    const validQuestions = questions.filter(q => 
      q.question.trim() && 
      q.optionA.trim() && 
      q.optionB.trim() && 
      q.optionC.trim() && 
      q.optionD.trim() && 
      q.correctAnswer
    );
    
    if (validQuestions.length === 0) {
      alert('❌ Please add at least one complete question with all 4 options and correct answer selected.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/authors/add-trivia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorEmail: session.user.email,
          bookId: selectedBook._id,
          questions: validQuestions
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message);
        setQuestions([
          { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' },
          { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' },
          { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' }
        ]);
      } else {
        alert('❌ ' + data.error);
      }
    } catch (err) {
      alert('❌ Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial' }}>
      <button onClick={() => router.push('/')} style={{ marginBottom: '20px', padding: '8px 16px', background: '#f1f1f1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>

      <h1 style={{ color: '#333', marginBottom: '10px' }}>🎯 Add Trivia Questions</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Help make our monthly trivia tournaments more engaging! Add multiple-choice questions about your books.
        If your book is featured in the monthly tournament, you'll earn ₦10!
      </p>

      {/* BOOK SELECTION */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>📚 Select a Book</h3>
        {books.length === 0 ? (
          <p style={{ color: '#666' }}>You don't have any uploaded books yet. Upload a book first to add trivia questions!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {books.map((book) => (
              <div
                key={book._id}
                onClick={() => handleSelectBook(book)}
                style={{
                  padding: '15px',
                  background: selectedBook?._id === book._id ? '#e7f3ff' : 'white',
                  border: selectedBook?._id === book._id ? '2px solid #667eea' : '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <strong style={{ fontSize: '16px' }}>{book.title}</strong>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                  {book.genre}
                </div>
                <div style={{ fontSize: '12px', color: book.triviaCount > 0 ? '#28a745' : '#999', marginTop: '5px' }}>
                  {book.triviaCount > 0 ? ` ✅ ${book.triviaCount} questions added` : '⚠️ No questions yet'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUESTION ENTRY */}
      {selectedBook && (
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '15px' }}>
            ✍️ Add Multiple-Choice Questions for: <span style={{ color: '#667eea' }}>{selectedBook.title}</span>
          </h3>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
            Add engaging questions with 4 options (A, B, C, D) and select the correct answer.
          </p>

          {questions.map((q, index) => (
            <div key={index} style={{ marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong>Question {index + 1}</strong>
                {questions.length > 1 && (
                  <button
                    onClick={() => handleRemoveQuestion(index)}
                    style={{ padding: '4px 8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <input
                type="text"
                placeholder="Enter your question..."
                value={q.question}
                onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
              
              <input
                type="text"
                placeholder="Option A..."
                value={q.optionA}
                onChange={(e) => handleQuestionChange(index, 'optionA', e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
              
              <input
                type="text"
                placeholder="Option B..."
                value={q.optionB}
                onChange={(e) => handleQuestionChange(index, 'optionB', e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
              
              <input
                type="text"
                placeholder="Option C..."
                value={q.optionC}
                onChange={(e) => handleQuestionChange(index, 'optionC', e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
              
              <input
                type="text"
                placeholder="Option D..."
                value={q.optionD}
                onChange={(e) => handleQuestionChange(index, 'optionD', e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
              
              <select
                value={q.correctAnswer}
                onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', background: 'white' }}
              >
                <option value="A">Correct Answer: Option A</option>
                <option value="B">Correct Answer: Option B</option>
                <option value="C">Correct Answer: Option C</option>
                <option value="D">Correct Answer: Option D</option>
              </select>
            </div>
          ))}

          <button
            onClick={handleAddQuestion}
            style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}
          >
            + Add Another Question
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: '12px 30px',
              background: isSubmitting ? '#999' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              width: '100%'
            }}
          >
            {isSubmitting ? '⏳ Submitting...' : '✅ Submit Questions'}
          </button>

          {message && (
            <div style={{ marginTop: '15px', padding: '15px', background: '#d4edda', color: '#155724', borderRadius: '8px', textAlign: 'center' }}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
