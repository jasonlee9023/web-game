import { store } from '../../data/store';

export class AnalyticsService {
  track(eventType: string, payload: Record<string, unknown>, identity: { userId?: string; guestId?: string }) {
    return store.createEvent({
      eventType,
      userId: identity.userId,
      guestId: identity.guestId,
      gameId: typeof payload.gameSlug === 'string' ? store.getGameBySlug(payload.gameSlug)?.id : undefined,
      payload,
    });
  }
}

export const analyticsService = new AnalyticsService();

