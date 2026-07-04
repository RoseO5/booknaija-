'use client';
import { useRouter } from 'next/router';

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;

  const errorMessages: Record<string, string> = {
    Configuration: 'Server configuration error. Check NEXTAUTH_URL and NEXTAUTH_SECRET.',
    AccessDenied: 'Access denied. You may not have permission.',
    Verification: 'Verification link expired or already used.',
    Default: 'An unknown error occurred.',
    OAuthSignin: 'Error in constructing Google authorization URL.',
    OAuthCallback: 'Error in handling Google response.',
    OAuthCreateAccount: 'Could not create OAuth account.',
    EmailCreateAccount: 'Could not create email account.',
    Callback: 'Error in OAuth callback handler.',
    OAuthAccountNotLinked: 'Account already linked to another identity.',
    EmailSignin: 'Check your email address.',
    CredentialsSignin: 'Invalid credentials.',
    SessionRequired: 'Please sign in to access this page.',
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '100px auto', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#dc3545' }}>❌ Authentication Error</h1>
      <div style={{ background: '#f8d7da', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
        <p style={{ margin: '0 0 10px', color: '#721c24', fontWeight: 'bold' }}>
          Error: {error || 'Unknown'}
        </p>
        <p style={{ margin: 0, color: '#721c24' }}>
          {errorMessages[error as string] || errorMessages.Default}
        </p>
      </div>
      <a href="/" style={{ color: '#667eea', fontWeight: 'bold', textDecoration: 'none' }}>
        ← Back to Home
      </a>
    </div>
  );
}
