import { store } from '../../data/store';

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
}

export const adminService = new AdminService();

