import type { GameCatalogItem } from '@casual-game-world/shared';

import { http } from './http';

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

function rewriteLoopbackUrlOrigin(sourceUrl: string) {
  if (typeof window === 'undefined') {
    return sourceUrl;
  }

  try {
    const parsed = new URL(sourceUrl);
    if (!LOOPBACK_HOSTNAMES.has(parsed.hostname)) {
      return sourceUrl;
    }

    return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, window.location.origin).toString();
  } catch {
    return sourceUrl;
  }
}

function normalizeGame(game: GameCatalogItem): GameCatalogItem {
  return {
    ...game,
    thumbnailUrl: rewriteLoopbackUrlOrigin(game.thumbnailUrl),
    bannerUrl: rewriteLoopbackUrlOrigin(game.bannerUrl),
    entryUrl: rewriteLoopbackUrlOrigin(game.entryUrl),
  };
}

export function fetchGames(params?: { search?: string; category?: string }) {
  const query = new URLSearchParams();

  if (params?.search) {
    query.set('search', params.search);
  }

  if (params?.category) {
    query.set('category', params.category);
  }

  return http<GameCatalogItem[]>(`/api/games${query.size ? `?${query.toString()}` : ''}`).then((games) =>
    games.map((game) => normalizeGame(game)),
  );
}

export function fetchGame(slug: string) {
  return http<GameCatalogItem>(`/api/games/${slug}`).then((game) => normalizeGame(game));
}

export function fetchRelatedGames(slug: string) {
  return http<GameCatalogItem[]>(`/api/games/${slug}/related`).then((games) => games.map((game) => normalizeGame(game)));
}
