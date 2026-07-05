import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      subscription?: {
        active: boolean;
        accessCard: string | null;
        expiresAt?: string | Date | null; // <--- Added this line
      };
    } & DefaultSession['user'];
  }
}
