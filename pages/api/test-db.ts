import { MongoClient } from 'mongodb';
export default async function handler(req, res) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) return res.status(500).json({ success: false, error: 'MONGODB_URI missing' });
    const client = new MongoClient(uri);
    await client.connect();
    await client.db('booknaija').command({ ping: 1 });
    await client.close();
    res.status(200).json({ success: true, message: '✅ MongoDB Connected!', database: 'booknaija' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
