import bcrypt from 'bcryptjs';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';

import type { AuthUser, LoginInput, SignupInput } from '@casual-game-world/shared';

import { env } from '../../config/env';
import { store } from '../../data/store';
import { isoNow } from '../../utils/dates';
import { HttpError } from '../../utils/http';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/tokens';

function toAuthUser(user: { id: string; email: string; displayName: string; role: 'user' | 'admin'; avatarUrl?: string }): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie('cgw_refresh_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: env.refreshTokenTtlSeconds * 1000,
  });
}

function createTokenBundle(user: AuthUser, res: Response) {
  const tokenPayload = {
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  } as const;

  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);
  store.saveRefreshToken(refreshToken, user.id);
  setRefreshCookie(res, refreshToken);
  return { accessToken, user };
}

export class AuthService {
  signup(input: SignupInput, res: Response) {
    const existing = store.users.find((user) => user.email === input.email);
    if (existing) {
      throw new HttpError(409, 'Email is already registered');
    }

    const user = {
      id: randomUUID(),
      email: input.email,
      displayName: input.displayName,
      avatarUrl: '',
      role: 'user' as const,
      status: 'active' as const,
      passwordHash: bcrypt.hashSync(input.password, 10),
      createdAt: isoNow(),
      lastLoginAt: isoNow(),
    };

    store.users.unshift(user);
    store.persistUsers();
    return createTokenBundle(toAuthUser(user), res);
  }

  login(input: LoginInput, res: Response) {
    const user = store.users.find((item) => item.email === input.email);
    if (!user) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const valid = bcrypt.compareSync(input.password, user.passwordHash);
    if (!valid) {
      throw new HttpError(401, 'Invalid email or password');
    }

    user.lastLoginAt = isoNow();
    store.persistUsers();
    return createTokenBundle(toAuthUser(user), res);
  }

  refresh(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) {
      throw new HttpError(401, 'Refresh token missing');
    }

    if (!store.hasRefreshToken(refreshToken)) {
      throw new HttpError(401, 'Refresh token expired');
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = store.users.find((item) => item.id === payload.sub);
    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    store.deleteRefreshToken(refreshToken);
    return createTokenBundle(toAuthUser(user), res);
  }

  logout(refreshToken: string | undefined, res: Response) {
    if (refreshToken) {
      store.deleteRefreshToken(refreshToken);
    }

    res.clearCookie('cgw_refresh_token');
    return { success: true };
  }

  updateProfile(userId: string, displayName: string) {
    const user = store.users.find((item) => item.id === userId);
    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    user.displayName = displayName;
    store.persistUsers();
    return toAuthUser(user);
  }
}

export const authService = new AuthService();
