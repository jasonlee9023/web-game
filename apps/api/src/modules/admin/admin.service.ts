import { store } from '../../data/store';
import { generateHeroJourneyLevelInput } from './hero-journey-ai';

export class AdminService {
  dashboard() {
    return store.getDashboardSummary();
  }

  listGames() {
    return store.games;
  }

  createGame(payload: Parameters<typeof store.addGame>[0]) {
    return store.addGame(payload);
  }

  updateGame(id: string, patch: Parameters<typeof store.updateGame>[1]) {
    return store.updateGame(id, patch);
  }

  publishGame(id: string) {
    return store.updateGame(id, { status: 'published', publishedAt: new Date().toISOString() });
  }

  listHeroJourneyLevels() {
    return store.listHeroJourneyLevels();
  }

  createHeroJourneyLevel(payload: Parameters<typeof store.createHeroJourneyLevel>[0]) {
    return store.createHeroJourneyLevel(payload);
  }

  async generateHeroJourneyLevel(payload: Parameters<typeof generateHeroJourneyLevelInput>[0]) {
    return store.createHeroJourneyLevel(await generateHeroJourneyLevelInput(payload));
  }

  saveHeroJourneyLevel(levelId: string, map: Parameters<typeof store.saveHeroJourneyLevel>[1]) {
    return store.saveHeroJourneyLevel(levelId, map);
  }

  resetHeroJourneyLevel(levelId: string) {
    return store.resetHeroJourneyLevel(levelId);
  }
}

export const adminService = new AdminService();
