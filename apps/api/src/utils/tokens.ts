import jwt from 'jsonwebtoken';

import { env } from '../config/env';

interface TokenPayload {
  sub: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
}

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, env.accessTokenSecret, { expiresIn: env.accessTokenTtlSeconds });
}

export function signRefreshToken(payload: TokenPayload) {
  return jwt.sign(payload, env.refreshTokenSecret, { expiresIn: env.refreshTokenTtlSeconds });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.accessTokenSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.refreshTokenSecret) as TokenPayload;
}

