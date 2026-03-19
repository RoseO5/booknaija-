import { MongoClient } from 'mongodb';

export async function GET() {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      return Response.json({ error: "No MongoDB URI" }, { status: 500 });
    }

    const client = new MongoClient(uri);
    await client.connect();

    await client.db('booknaija').command({ ping: 1 });

    await client.close();

    return Response.json({ message: "✅ MongoDB Connected!" });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
