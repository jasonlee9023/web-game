import type { ScoreSubmissionInput } from '@casual-game-world/shared';

import { store } from '../../data/store';
import { HttpError } from '../../utils/http';

export class ScoresService {
  createSession(slug: string, identity: { userId?: string; guestId?: string }, context: { ipHash: string; userAgentHash: string }) {
    const game = store.getGameBySlug(slug);

    if (!game || game.status !== 'published') {
      throw new HttpError(404, 'Game not found');
    }

    return store.createSession({
      gameId: game.id,
      gameSlug: game.slug,
      userId: identity.userId,
      guestId: identity.guestId,
      ipHash: context.ipHash,
      userAgentHash: context.userAgentHash,
    });
  }

  submit(slug: string, payload: ScoreSubmissionInput, identity: { userId?: string; guestId?: string }) {
    return store.submitScore(slug, payload, identity);
  }

  myBest(slug: string, identity: { userId?: string; guestId?: string }) {
    return store.getBestScore(slug, identity);
  }
}

export const scoresService = new ScoresService();

