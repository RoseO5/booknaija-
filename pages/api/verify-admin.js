export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { password } = req.body;
  const isValid = password === process.env.ADMIN_PASSWORD;
  res.status(200).json({ valid: isValid });
}
