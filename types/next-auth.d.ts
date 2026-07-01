import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      subscription?: {
        active: boolean;
        plan: string | null;
        accessCard: string | null;
        expiresAt: Date | null;
      };
    } & DefaultSession['user'];
  }
}
