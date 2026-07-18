import type { GameCatalogItem } from '@casual-game-world/shared';
import type { Request, Response } from 'express';

import { ok, resolveWebOrigin, rewriteLoopbackUrlOrigin } from '../../utils/http';
import { gamesService } from './games.service';

function withResolvedAssetOrigins(game: GameCatalogItem, webOrigin: string): GameCatalogItem {
  return {
    ...game,
    thumbnailUrl: rewriteLoopbackUrlOrigin(game.thumbnailUrl, webOrigin),
    bannerUrl: rewriteLoopbackUrlOrigin(game.bannerUrl, webOrigin),
    entryUrl: rewriteLoopbackUrlOrigin(game.entryUrl, webOrigin),
  };
}

export const gamesController = {
  list(req: Request, res: Response) {
    const webOrigin = resolveWebOrigin(req);
    res.json(
      ok(
        gamesService
          .list(req.query.search?.toString(), req.query.category?.toString())
          .map((game) => withResolvedAssetOrigins(game, webOrigin)),
      ),
    );
  },

  detail(req: Request, res: Response) {
    const webOrigin = resolveWebOrigin(req);
    res.json(ok(withResolvedAssetOrigins(gamesService.getBySlug(req.params.slug.toString()), webOrigin)));
  },

  related(req: Request, res: Response) {
    const webOrigin = resolveWebOrigin(req);
    res.json(
      ok(gamesService.getRelated(req.params.slug.toString()).map((game) => withResolvedAssetOrigins(game, webOrigin))),
    );
  },

  heroJourneyLevels(req: Request, res: Response) {
    res.json(ok(gamesService.getHeroJourneyLevels(req.params.slug.toString())));
  },
};
