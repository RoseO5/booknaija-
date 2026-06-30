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
      // Auto-create user in MongoDB on first sign-in
      const client = await clientPromise;
      const db = client.db('booknaija');
      const existing = await db.collection('users').findOne({ email: user.email });
      
      if (!existing) {
        await db.collection('users').insertOne({
          email: user.email,
          name: user.name,
          image: user.image,
          role: 'reader',
          subscription: {
            active: false,
            plan: null,
            accessCard: null,
            provider: null,
            expiresAt: null
          },
          createdAt: new Date()
        });
      }
      return true;
    },
    async session({ session }) {
      // Add subscription + access card to session
      const client = await clientPromise;
      const db = client.db('booknaija');
      const user = await db.collection('users').findOne({ email: session.user.email });
      
      if (user) {
        session.user.id = user._id.toString();
        session.user.role = user.role;
        session.user.subscription = {
          active: user.subscription?.active || false,
          plan: user.subscription?.plan,
          accessCard: user.subscription?.accessCard,
          expiresAt: user.subscription?.expiresAt
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
});
