import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('booknaija');

    await db.command({ ping: 1 });

    res.status(200).json({ message: "✅ MongoDB Connected!" });
  } catch (error) {
    res.status(500).json({ error: "❌ Connection Failed", details: error.message });
  }
}

