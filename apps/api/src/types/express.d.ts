import type { AuthUser } from '@casual-game-world/shared';

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      requestId?: string;
    }
  }
}

export {};

