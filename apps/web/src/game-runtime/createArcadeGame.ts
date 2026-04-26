import { notifyReady, notifyStart, onHostMessage, requestRewardedAd, submitScore } from '@casual-game-world/game-sdk';

import type { RewardReason } from '@casual-game-world/shared';

interface ArcadeConfig {
  title: string;
  palette: {
    bg: string;
    bg2: string;
    accent: string;
    accentSoft: string;
    text: string;
  };
  mode: 'normal' | 'hard' | 'time-attack';
  durationMs: number;
  reviveMs: number;
  bonusPerHit: number;
}

export function createArcadeGame(canvas: HTMLCanvasElement, config: ArcadeConfig) {
  const maybeContext = canvas.getContext('2d');

  if (!maybeContext) {
    throw new Error('Canvas 2D context is required');
  }

  const ctx = maybeContext;

  const state = {
    running: false,
    ready: false,
    reviveAvailable: true,
    waitingReward: false,
    remainingMs: config.durationMs,
    elapsedMs: 0,
    score: 0,
    hits: 0,
    lastFrame: performance.now(),
    targetX: canvas.width / 2,
    targetY: canvas.height / 2,
    targetR: 48,
    pulse: 0,
  };

  function spawnTarget() {
    state.targetX = 80 + Math.random() * (canvas.width - 160);
    state.targetY = 120 + Math.random() * (canvas.height - 220);
    state.targetR = 34 + Math.random() * 24;
  }

  function sendGameOver(reviveAvailable: boolean) {
    submitScore({
      score: state.score,
      playTimeMs: Math.round(state.elapsedMs),
      mode: config.mode,
      metadata: {
        reviveAvailable,
        hits: state.hits,
      },
    });
  }

  function finishRound() {
    state.running = false;
    if (state.reviveAvailable) {
      state.waitingReward = true;
      sendGameOver(true);
      requestRewardedAd('REVIVE');
      return;
    }

    sendGameOver(false);
  }

  function start() {
    if (state.running) {
      return;
    }
    state.running = true;
    notifyStart();
  }

  function resetForRevive() {
    state.reviveAvailable = false;
    state.waitingReward = false;
    state.remainingMs = config.reviveMs;
    state.running = true;
    spawnTarget();
  }

  function cancelReward() {
    state.waitingReward = false;
  }

  function tap(x: number, y: number) {
    if (state.waitingReward) {
      return;
    }

    if (!state.running) {
      start();
    }

    const dx = x - state.targetX;
    const dy = y - state.targetY;
    const hit = Math.sqrt(dx * dx + dy * dy) <= state.targetR;

    if (!hit) {
      return;
    }

    state.hits += 1;
    state.score += config.bonusPerHit + Math.round(state.remainingMs / 250);
    spawnTarget();
  }

  function pointer(event: MouseEvent | TouchEvent) {
    const rect = canvas.getBoundingClientRect();
    const point = 'touches' in event ? event.touches[0] : event;
    const x = ((point.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((point.clientY - rect.top) / rect.height) * canvas.height;
    tap(x, y);
  }

  canvas.addEventListener('mousedown', pointer);
  canvas.addEventListener('touchstart', pointer);
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      tap(state.targetX, state.targetY);
    }
  });

  onHostMessage((event) => {
    if (event.data.type === 'REWARD_GRANTED' && event.data.payload.reason === ('REVIVE' satisfies RewardReason)) {
      resetForRevive();
    }

    if (event.data.type === 'REWARD_CANCELED' && event.data.payload.reason === ('REVIVE' satisfies RewardReason)) {
      cancelReward();
    }
  });

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.min(window.innerWidth, 720);
    const height = width * 1.45;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spawnTarget();
  }

  function draw(now: number) {
    const delta = now - state.lastFrame;
    state.lastFrame = now;
    state.pulse += delta / 600;

    if (state.running) {
      state.remainingMs -= delta;
      state.elapsedMs += delta;

      if (state.remainingMs <= 0) {
        state.remainingMs = 0;
        finishRound();
      }
    }

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, config.palette.bg);
    gradient.addColorStop(1, config.palette.bg2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(24, 24, width - 48, 86);

    ctx.fillStyle = config.palette.text;
    ctx.font = '700 28px Space Grotesk, sans-serif';
    ctx.fillText(config.title, 44, 62);
    ctx.font = '500 18px Space Grotesk, sans-serif';
    ctx.fillText(`Score ${Math.round(state.score)}`, 44, 92);
    ctx.fillText(`${Math.ceil(state.remainingMs / 1000)}s`, width - 112, 92);

    ctx.beginPath();
    ctx.fillStyle = config.palette.accentSoft;
    ctx.arc(state.targetX, state.targetY, state.targetR + Math.sin(state.pulse) * 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = config.palette.accent;
    ctx.arc(state.targetX, state.targetY, state.targetR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = config.palette.text;
    ctx.font = '600 16px Space Grotesk, sans-serif';
    ctx.fillText('tap / space', state.targetX - 34, state.targetY + 6);

    if (!state.running) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(36, height - 170, width - 72, 120);
      ctx.fillStyle = config.palette.text;
      ctx.font = '700 22px Space Grotesk, sans-serif';

      if (state.waitingReward) {
        ctx.fillText('광고 보고 10초 더 플레이할 수 있어요', 62, height - 112);
        ctx.font = '500 16px Space Grotesk, sans-serif';
        ctx.fillText('상단 모달에서 이어하기를 선택하거나 랭킹으로 마감하세요.', 62, height - 80);
      } else {
        ctx.fillText('화면을 터치해 시작하세요', 62, height - 102);
      }
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  notifyReady();
  state.ready = true;
  requestAnimationFrame(draw);
}
