import { store } from '../../data/store';
import { HttpError } from '../../utils/http';

export class GamesService {
  list(search?: string, category?: string) {
    return store.getPublishedGames().filter((game) => {
      const matchSearch = search
        ? [game.title, game.shortDescription, ...game.tags].some((field) =>
            field.toLowerCase().includes(search.toLowerCase()),
          )
        : true;
      const matchCategory = category ? game.categories.includes(category) : true;
      return matchSearch && matchCategory;
    });
  }

  getBySlug(slug: string) {
    const game = store.getGameBySlug(slug);
    if (!game || game.status !== 'published') {
      throw new HttpError(404, 'Game not found');
    }
    return game;
  }

  getRelated(slug: string) {
    return store.getRelatedGames(slug);
  }
}

export const gamesService = new GamesService();

