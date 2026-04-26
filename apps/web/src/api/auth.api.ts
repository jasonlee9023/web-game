import type { AuthUser, LoginInput, SignupInput } from '@casual-game-world/shared';

import { http } from './http';

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export function signup(input: SignupInput) {
  return http<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function login(input: LoginInput) {
  return http<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function logout() {
  return http<{ success: boolean }>('/api/auth/logout', {
    method: 'POST',
  });
}

export function refresh() {
  return http<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
  });
}

export function me() {
  return http<AuthUser | null>('/api/auth/me');
}

export function updateMe(displayName: string) {
  return http<AuthUser>('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify({ displayName }),
  });
}

