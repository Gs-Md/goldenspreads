import { authClient, authBaseUrl } from './authClient';

const AUTH_URL = authBaseUrl;

// --------------------------------------------------
// GET NEON AUTH JWT
// --------------------------------------------------

async function getNeonToken() {
  if (!AUTH_URL) {
    throw new Error('Neon authentication URL is missing.');
  }

  const response = await fetch(
    `${AUTH_URL.replace(/\/+$/, '')}/token`,
    {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload.error ||
      payload.message ||
      'Neon Auth token request failed.'
    );
  }

  const token = payload.token || payload.data?.token;

  if (typeof token !== 'string' || !token) {
    throw new Error(
      'Neon Auth did not return a valid token.'
    );
  }

  return token;
}

// --------------------------------------------------
// AUTHENTICATED GOLDEN REWARDS API REQUEST
// --------------------------------------------------

export async function loyaltyRequest(path, options = {}) {
  if (!authClient) {
    throw new Error(
      'Golden Rewards authentication is not configured.'
    );
  }

  const [token, sessionResult] = await Promise.all([
    getNeonToken(),
    authClient.getSession(),
  ]);

  const sessionId = sessionResult?.data?.session?.id;

  if (!sessionId) {
    throw new Error(
      'Neon Auth session ID is missing. Please sign in again.'
    );
  }

  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Golden-Session-Id': sessionId,

      ...(options.body
        ? { 'Content-Type': 'application/json' }
        : {}),

      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload.error ||
      'The request could not be completed.'
    );

    error.status = response.status;

    throw error;
  }

  return payload;
}