import type {
  DashboardSummary,
  GameCatalogItem,
  HeroJourneyLevelCreateInput,
  HeroJourneyLevelGenerateInput,
  HeroJourneyLevelSnapshot,
} from '@casual-game-world/shared';

import { http } from './http';

export function fetchDashboard() {
  return http<DashboardSummary>('/api/admin/dashboard');
}

export function fetchAdminGames() {
  return http<AdminGameItem[]>('/api/admin/games');
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

export type AdminGameItem = GameCatalogItem & {
  validationRule: {
    minPlayTimeMs: number;
    maxScore: number;
    allowedModes: string[];
  };
  relatedSlugs: string[];
};

export function updateAdminGame(id: string, payload: Record<string, unknown>) {
  return http<AdminGameItem>(`/api/admin/games/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function fetchAdminHeroJourneyLevels() {
  return http<HeroJourneyLevelSnapshot[]>('/api/admin/games/hero-journey/levels');
}

export function createAdminHeroJourneyLevel(payload: HeroJourneyLevelCreateInput) {
  return http<HeroJourneyLevelSnapshot>('/api/admin/games/hero-journey/levels', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function generateAdminHeroJourneyLevel(payload: HeroJourneyLevelGenerateInput) {
  return http<HeroJourneyLevelSnapshot>('/api/admin/games/hero-journey/levels/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function resetAdminHeroJourneyLevel(levelId: string) {
  return http<HeroJourneyLevelSnapshot>(`/api/admin/games/hero-journey/levels/${levelId}`, {
    method: 'DELETE',
  });
}
