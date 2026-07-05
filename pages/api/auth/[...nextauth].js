import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import clientPromise from '../../../lib/mongodb';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const client = await clientPromise;
      const db = client.db('booknaija');
      await db.collection('users').updateOne(
        { email: user.email },
        { 
          $setOnInsert: { 
            email: user.email, 
            name: user.name, 
            role: 'reader', 
            subscription: { 
              active: false,
              expiresAt: null
            }, 
            createdAt: new Date() 
          } 
        },
        { upsert: true }
      );
      return true;
    },
    async session({ session }) {
      const client = await clientPromise;
      const db = client.db('booknaija');
      const user = await db.collection('users').findOne({ email: session.user.email });
      
      if (user) { 
        session.user.id = user._id.toString(); 
        
        // AUTO-EXPIRE: Check if subscription has expired
        if (user.subscription?.active && user.subscription?.expiresAt) {
          const expiresAt = new Date(user.subscription.expiresAt);
          const now = new Date();
          
          if (now > expiresAt) {
            // Subscription expired! Mark as inactive
            await db.collection('users').updateOne(
              { email: user.email },
              { $set: { 'subscription.active': false } }
            );
            session.user.subscription = { ...user.subscription, active: false };
          } else {
            session.user.subscription = user.subscription;
          }
        } else {
          session.user.subscription = user.subscription;
        }
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});
