import type { PlaySession, ScoreRecord, ScoreSubmissionInput } from '@casual-game-world/shared';

import { getGuestId, http } from './http';

export function createPlaySession(slug: string, mode: ScoreSubmissionInput['mode']) {
  return http<Pick<PlaySession, 'sessionId' | 'seed' | 'startedAt'>>(`/api/games/${slug}/sessions`, {
    method: 'POST',
    body: JSON.stringify({ mode }),
  });
}

export function submitScore(slug: string, payload: ScoreSubmissionInput) {
  return http<ScoreRecord>(`/api/games/${slug}/scores`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchMyBestScore(slug: string) {
  const query = new URLSearchParams({
    guestId: getGuestId(),
  });
  return http<ScoreRecord | null>(`/api/games/${slug}/my-best-score?${query.toString()}`);
}
