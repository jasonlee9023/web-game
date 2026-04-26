import type { RankingPeriod } from '@casual-game-world/shared';

import { store } from '../../data/store';

export class RankingsService {
  gameRanking(slug: string, filter: { period: 'daily' | 'weekly' | 'monthly' | 'all'; mode: 'normal' | 'hard' | 'time-attack' }, identity: { userId?: string; guestId?: string }) {
    return store.getGameRanking(slug, filter, identity);
  }

  globalRanking(period: RankingPeriod) {
    return store.getGlobalRanking(period);
  }

  myScores(userId: string) {
    return store.getMyScores(userId);
  }
}

export const rankingsService = new RankingsService();

