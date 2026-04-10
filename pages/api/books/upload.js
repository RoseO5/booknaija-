export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Simple success response
  res.status(200).json({ 
    success: true, 
    message: 'Upload API working!',
    test: 'This proves the API is deployed'
  });
}
