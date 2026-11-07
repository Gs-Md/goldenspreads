import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

// Production uses our same-origin Vercel proxy.
// Local development continues using the direct Neon URL.
const authUrl =
  process.env.NODE_ENV === 'production'
    ? `${window.location.origin}/api/neon-auth`
    : process.env.REACT_APP_NEON_AUTH_BASE_URL;

export const authBaseUrl = authUrl || '';

export const authClient = authUrl
  ? createAuthClient(authUrl, {
      adapter: BetterAuthReactAdapter(),
      fetchOptions: {
        credentials: 'include',
      },
    })
  : null;