import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name, phone, network } = req.body;
    const client = await clientPromise;
    const db = client.db('booknaija');

    // Check if user exists
    let user = await db.collection('users').findOne({ email });

    if (user) {
      // Update existing user
      await db.collection('users').updateOne(
        { email },
        { 
          $set: { 
            name, 
            phone, 
            network,
            role: 'reader',
            'subscription.active': true,
            'subscription.startDate': new Date(),
            'subscription.endDate': new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
            updatedAt: new Date()
          }
        }
      );
      return res.status(200).json({ 
        success: true, 
        message: '✅ Welcome back! Subscription activated.',
        userId: user._id 
      });
    }

    // Create new user
    const result = await db.collection('users').insertOne({
      email,
      name,
      phone,
      network,
      role: 'reader',
      subscription: {
        active: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
        amount: 1000
      },
      stats: {
        booksRead: 0,
        totalMinutes: 0,
        uniqueBooksRead: 0,
        eligibleForPrize: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(200).json({ 
      success: true, 
      message: '✅ Subscription successful! Welcome to BookNaija!',
      userId: result.insertedId 
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe', details: error.message });
  }
}
