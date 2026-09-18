import clientPromise from '../../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const client = await clientPromise;
    const db = client.db('booknaija');
    
    // 1. Count exactly what the revenue calculator sees
    const activeReaders = await db.collection('users').countDocuments({ 
      role: 'reader', 
      'subscription.active': true 
    });

    // 2. Get a safe, anonymized list of all users and their subscription status
    const allUsers = await db.collection('users').find({}).project({ 
      email: 1, 
      role: 1, 
      'subscription.active': 1, 
      'subscription.status': 1 
    }).toArray();

    res.status(200).json({ 
      message: `Revenue calculator sees ${activeReaders} active subscriber(s).`,
      activeCount: activeReaders,
      allUsers: allUsers.map(u => ({
        email: u.email,
        role: u.role,
        isActive: u.subscription?.active,
        status: u.subscription?.status || 'none'
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
