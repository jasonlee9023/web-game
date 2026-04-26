import type { ApiEnvelope } from '@casual-game-world/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const ACCESS_TOKEN_KEY = 'cgw-access-token';
const GUEST_ID_KEY = 'cgw-guest-id';

function randomGuestId() {
  return `guest-${Math.random().toString(36).slice(2, 10)}`;
}

export function getGuestId() {
  const existing = localStorage.getItem(GUEST_ID_KEY);

  if (existing) {
    return existing;
  }

  const guestId = randomGuestId();
  localStorage.setItem(GUEST_ID_KEY, guestId);
  return guestId;
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

async function refreshAccessToken() {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Session refresh failed');
  }

  const json = (await response.json()) as ApiEnvelope<{ accessToken: string }>;
  setAccessToken(json.data.accessToken);
  return json.data.accessToken;
}

interface HttpOptions extends RequestInit {
  includeGuestId?: boolean;
}

function isMethodWithBody(method: string) {
  return !['GET', 'HEAD'].includes(method);
}

export async function http<T>(path: string, init?: HttpOptions, allowRetry = true): Promise<T> {
  const token = getAccessToken();
  const method = (init?.method ?? 'GET').toUpperCase();
  const headers = new Headers(init?.headers ?? {});
  const shouldIncludeGuestId = init?.includeGuestId ?? isMethodWithBody(method);

  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (shouldIncludeGuestId) {
    headers.set('x-guest-id', getGuestId());
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method,
    credentials: 'include',
    headers,
  });

  if (response.status === 401 && allowRetry && path !== '/api/auth/refresh') {
    try {
      const nextToken = await refreshAccessToken();
      return http<T>(
        path,
        {
          ...init,
          headers: new Headers({
            ...(init?.headers ?? {}),
            Authorization: `Bearer ${nextToken}`,
          }),
        },
        false,
      );
    } catch {
      clearAccessToken();
    }
  }

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error ?? 'API request failed');
  }

  return (json as ApiEnvelope<T>).data;
}
