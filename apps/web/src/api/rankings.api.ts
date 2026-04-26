import type { GlobalRankingResponse, RankingFilter, RankingResponse, ScoreRecord } from '@casual-game-world/shared';

import { getGuestId, http } from './http';

export function fetchGameRanking(slug: string, filter: RankingFilter) {
  const query = new URLSearchParams({
    period: filter.period,
    mode: filter.mode,
    guestId: getGuestId(),
  });
  return http<RankingResponse>(`/api/games/${slug}/rankings?${query.toString()}`);
}

export function fetchGlobalRanking(period: RankingFilter['period']) {
  const query = new URLSearchParams({ period });
  return http<GlobalRankingResponse>(`/api/rankings/global?${query.toString()}`);
}

export function fetchMyScores() {
  return http<Array<ScoreRecord & { game?: { title: string; slug: string } }>>('/api/users/me/scores');
}
