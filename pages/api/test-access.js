export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API routing works!',
    timestamp: new Date().toISOString()
  });
}
