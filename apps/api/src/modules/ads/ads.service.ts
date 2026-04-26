import type { AdPage } from '@casual-game-world/shared';

import { store } from '../../data/store';

export class AdsService {
  getConfig(page: AdPage, gameSlug?: string) {
    return store.getAdConfig(page, gameSlug);
  }

  trackEvent(payload: { type: string; page: string; gameSlug?: string; slotId?: string; userId?: string; guestId?: string }) {
    return store.createEvent({
      eventType: `ad:${payload.type}`,
      userId: payload.userId,
      guestId: payload.guestId,
      gameId: payload.gameSlug ? store.getGameBySlug(payload.gameSlug)?.id : undefined,
      payload,
    });
  }
}

export const adsService = new AdsService();

