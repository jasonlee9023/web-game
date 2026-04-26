import { ref } from 'vue';
import { defineStore } from 'pinia';

import type { ScoreSubmissionInput, ScoreRecord } from '@casual-game-world/shared';

import { createPlaySession, fetchMyBestScore, submitScore } from '@/api/scores.api';

export const usePlaySessionStore = defineStore('playSession', () => {
  const session = ref<{ sessionId: string; seed: string; startedAt: string } | null>(null);
  const submitting = ref(false);
  const lastScore = ref<ScoreRecord | null>(null);
  const myBest = ref<ScoreRecord | null>(null);
  const iframeKey = ref(0);

  async function start(slug: string, mode: ScoreSubmissionInput['mode']) {
    session.value = await createPlaySession(slug, mode);
    myBest.value = await fetchMyBestScore(slug);
    return session.value;
  }

  async function finalize(slug: string, payload: Omit<ScoreSubmissionInput, 'sessionId'>) {
    if (!session.value) {
      throw new Error('Missing play session');
    }

    submitting.value = true;
    try {
      lastScore.value = await submitScore(slug, {
        sessionId: session.value.sessionId,
        ...payload,
      });
      myBest.value = await fetchMyBestScore(slug);
      return lastScore.value;
    } finally {
      submitting.value = false;
    }
  }

  async function replay(slug: string, mode: ScoreSubmissionInput['mode']) {
    iframeKey.value += 1;
    await start(slug, mode);
  }

  return {
    session,
    submitting,
    lastScore,
    myBest,
    iframeKey,
    start,
    finalize,
    replay,
  };
});
