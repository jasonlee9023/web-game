import type { AdPage, AdSlotConfig } from '@casual-game-world/shared';

import { http } from './http';

export function fetchAdConfig(page: AdPage, gameSlug?: string) {
  const query = new URLSearchParams({ page });

  if (gameSlug) {
    query.set('gameSlug', gameSlug);
  }

  return http<AdSlotConfig[]>(`/api/ads/config?${query.toString()}`);
}

export function trackAdEvent(payload: { type: string; page: string; gameSlug?: string; slotId?: string }) {
  return http('/api/ads/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

