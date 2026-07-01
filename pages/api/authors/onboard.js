import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { email, fullName, location, state, bankName, accountNumber, accountName, phoneNumber, agreedToTerms } = req.body;

    if (!email || !fullName || !bankName || !accountNumber || !agreedToTerms) {
      return res.status(400).json({ error: 'All fields required + compliance agreement' });
    }

    // Basic validation for Nigerian bank account (10 digits)
    if (!/^\d{10}$/.test(accountNumber)) {
      return res.status(400).json({ error: 'Account number must be 10 digits' });
    }

    const client = await clientPromise;
    const db = client.db('booknaija');

    // Check if author already exists
    const existing = await db.collection('authors').findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Author already registered with this email' });
    }

    // Create author record
    await db.collection('authors').insertOne({
      email,
      fullName,
      location,
      state,
      bankName,
      accountNumber,
      accountName,
      phoneNumber,
      agreedToTerms,
      agreedAt: new Date(),
      status: 'active',
      totalBooks: 0,
      totalReads: 0,
      earnings: 0,
      createdAt: new Date()
    });

    // Also update users collection to mark as author
    await db.collection('users').updateOne(
      { email },
      { 
        $set: { 
          role: 'author',
          isOnboardedAuthor: true 
        },
        $setOnInsert: { email, createdAt: new Date() }
      },
      { upsert: true }
    );

    res.status(200).json({ 
      success: true, 
      message: '✅ Author onboarded successfully! You can now upload books.'
    });
  } catch (error) {
    console.error('Author onboarding error:', error);
    res.status(500).json({ error: error.message });
  }
}
