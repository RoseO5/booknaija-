// pages/test-db.js
import clientPromise from '../lib/mongodb';

export default async function TestDB() {
try {
const client = await clientPromise;
const db = client.db('booknaija');

// Test connection  
await db.command({ ping: 1 });  
  
return (  
  <div style={{ padding: '50px', textAlign: 'center' }}>  
    <h1>✅ MongoDB Connected!</h1>  
    <p>Your database is ready to use.</p>  
  </div>  
);

} catch (error) {
return (
<div style={{ padding: '50px', textAlign: 'center' }}>
<h1>❌ Connection Failed</h1>
<p>{error.message}</p>
</div>
);
}
}


