export default function handler(req, res) {
  console.log('🚀 [TEST API] Received request!', req.method, req.body);
  if (req.method === 'POST') {
    return res.status(200).json({ success: true, message: 'POST works perfectly!' });
  }
  res.status(200).json({ message: 'This is a GET request.' });
}
