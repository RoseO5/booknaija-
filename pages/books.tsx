export default function Books() {
  const mockBooks = [
    { id: 1, title: "Lagos Dreams", author: "Ada Nwosu", category: "Fiction", pages: 142 },
    { id: 2, title: "Abuja Whispers", author: "Chidi Okoro", category: "Romance", pages: 189 },
    { id: 3, title: "Port Harcourt Nights", author: "Emeka Johnson", category: "Thriller", pages: 215 },
    { id: 4, title: "Kano Chronicles", author: "Fatima Bello", category: "Historical", pages: 167 },
    { id: 5, title: "Ibadan Memories", author: "Tunde Adebayo", category: "Drama", pages: 198 },
    { id: 6, title: "Enugu Tales", author: "Grace Okafor", category: "Fiction", pages: 156 }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8f9fa',
      padding: '30px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#667eea', margin: 0 }}>📚 Available Books</h1>
          <a href="/" style={{ color: '#667eea', textDecoration: 'none' }}>← Home</a>
        </div>

        <div style={{ background: '#d1ecf1', padding: '15px', borderRadius: '10px', marginBottom: '25px', borderLeft: '4px solid #17a2b8' }}>
          <strong>🎯 Prize Alert:</strong> Read 50 books in 6 months to enter our ₦5,000 prize draw (top 3 readers win)!
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
          {mockBooks.map(book => (
            <div key={book.id} style={{ 
              background: 'white', 
              borderRadius: '12px', 
              overflow: 'hidden',
              boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s'
            }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ height: '200px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '6rem' }}>📖</span>
              </div>
              
              <div style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem' }}>{book.title}</h3>
                <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '0.95rem' }}>
                  <strong>Author:</strong> {book.author}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#667eea', fontSize: '0.9rem', marginBottom: '15px' }}>
                  <span>📖 {book.pages} pages</span>
                  <span>🏷️ {book.category}</span>
                </div>
                
                <button 
                  onClick={() => {
                    const mins = prompt(`How many minutes did you read "${book.title}"?`);
                    const pages = prompt('How many pages did you read?');
                    if (mins && pages) {
                      alert(`✅ Reading tracked!\n${mins} minutes, ${pages} pages\n\nKeep reading to qualify for the ₦5,000 prize!`);
                    }
                  }}
                  style={{ 
                    width: '100%',
                    background: '#28a745', 
                    color: 'white', 
                    border: 'none',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}
                >
                  📖 Read Book
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center', padding: '30px', background: '#e7f3ff', borderRadius: '12px' }}>
          <h2 style={{ color: '#007bff', margin: '0 0 15px 0' }}>🏆 Monthly Prize Draw</h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>
            <strong>₦5,000</strong> for each of the top 3 readers every 6 months!
          </p>
          <p style={{ margin: '0 0 20px 0' }}>
            <strong>Requirements:</strong> Read 50+ books within 6 months
          </p>
          <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
            Prize pool funded by subscription fees • Winners selected based on reading activity
          </p>
        </div>
      </div>
    </div>
  );
}
