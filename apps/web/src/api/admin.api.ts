import type { DashboardSummary, GameCatalogItem } from '@casual-game-world/shared';

import { http } from './http';

export function fetchDashboard() {
  return http<DashboardSummary>('/api/admin/dashboard');
}

export function fetchAdminGames() {
  return http<GameCatalogItem[]>('/api/admin/games');
}

export function publishGame(id: string) {
  return http<GameCatalogItem>(`/api/admin/games/${id}/publish`, {
    method: 'POST',
  });
}

export function createAdminGame(payload: Record<string, unknown>) {
  return http<GameCatalogItem>('/api/admin/games', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

