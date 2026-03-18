import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      return res.status(500).json({ error: "No MongoDB URI" });
    }

    const client = new MongoClient(uri);
    await client.connect();

    await client.db('booknaija').command({ ping: 1 });

    await client.close();

    res.status(200).json({ message: "✅ MongoDB Connected!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
