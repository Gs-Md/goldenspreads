
import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

const authUrl = process.env.REACT_APP_NEON_AUTH_BASE_URL;

export const authClient = authUrl
  ? createAuthClient(authUrl, {
      adapter: BetterAuthReactAdapter(),
      fetchOptions: {
        credentials: 'include',
      },
    })
  : null;
