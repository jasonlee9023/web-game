import { notifyReady, notifyStart, onHostMessage, requestRewardedAd, submitScore } from '@casual-game-world/game-sdk';

import type { GameMode, RewardReason } from '@casual-game-world/shared';

export interface PointerState {
  x: number;
  y: number;
  pressed: boolean;
}

export interface GameRuntimeState {
  width: number;
  height: number;
  dpr: number;
  running: boolean;
  started: boolean;
  finished: boolean;
  waitingReward: boolean;
  reviveAvailable: boolean;
  remainingMs: number;
  elapsedMs: number;
  score: number;
  frame: number;
  pointer: PointerState;
}

export interface RuntimePalette {
  bg: string;
  bg2: string;
  panel: string;
  text: string;
  accent: string;
  accentSoft: string;
  danger: string;
  success: string;
}

export interface RuntimeConfig {
  title: string;
  mode: GameMode;
  durationMs: number;
  reviveMs: number;
  aspectRatio: number;
  maxWidth?: number;
  intro: string;
  palette: RuntimePalette;
  rewardReason?: RewardReason;
}

export interface RuntimeContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  config: RuntimeConfig;
  state: GameRuntimeState;
  start: () => void;
  addScore: (value: number) => void;
  setScore: (value: number) => void;
  finishRound: (metadata?: Record<string, unknown>) => void;
  clamp: (value: number, min: number, max: number) => number;
  random: (min: number, max: number) => number;
}

export interface RuntimeHandlers {
  onResize?: (context: RuntimeContext) => void;
  onStart?: (context: RuntimeContext) => void;
  onRevive?: (context: RuntimeContext) => void;
  onRewardCanceled?: (context: RuntimeContext) => void;
  update: (deltaMs: number, context: RuntimeContext) => void;
  draw: (context: RuntimeContext) => void;
  pointerDown?: (point: PointerState, context: RuntimeContext) => void;
  pointerMove?: (point: PointerState, context: RuntimeContext) => void;
  pointerUp?: (point: PointerState, context: RuntimeContext) => void;
  keyDown?: (code: string, context: RuntimeContext) => void;
  keyUp?: (code: string, context: RuntimeContext) => void;
}

function resolvePoint(canvas: HTMLCanvasElement, event: MouseEvent | TouchEvent, width: number, height: number) {
  const rect = canvas.getBoundingClientRect();
  const source = 'touches' in event ? event.touches[0] ?? event.changedTouches[0] : event;

  return {
    x: ((source.clientX - rect.left) / rect.width) * width,
    y: ((source.clientY - rect.top) / rect.height) * height,
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

export function fillGradient(ctx: CanvasRenderingContext2D, width: number, height: number, top: string, bottom: string) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export function drawHud(context: RuntimeContext, subtitle?: string) {
  const { ctx, state, config } = context;

  drawRoundedRect(ctx, 18, 18, state.width - 36, 82, 26);
  ctx.fillStyle = config.palette.panel;
  ctx.fill();

  ctx.fillStyle = config.palette.text;
  ctx.font = '700 28px Space Grotesk, sans-serif';
  ctx.fillText(config.title, 36, 54);
  ctx.font = '500 16px Space Grotesk, sans-serif';
  ctx.fillText(subtitle ?? config.intro, 36, 80);

  ctx.textAlign = 'right';
  ctx.font = '700 22px Space Grotesk, sans-serif';
  ctx.fillText(`${Math.round(state.score).toLocaleString()} pts`, state.width - 34, 52);
  ctx.font = '500 18px Space Grotesk, sans-serif';
  ctx.fillText(`${Math.ceil(state.remainingMs / 1000)}s`, state.width - 34, 80);
  ctx.textAlign = 'left';
}

function drawOverlayCard(context: RuntimeContext, title: string, description: string) {
  const { ctx, state, config } = context;

  drawRoundedRect(ctx, 28, state.height - 170, state.width - 56, 118, 24);
  ctx.fillStyle = 'rgba(12, 16, 18, 0.35)';
  ctx.fill();

  ctx.fillStyle = config.palette.text;
  ctx.font = '700 22px Space Grotesk, sans-serif';
  ctx.fillText(title, 48, state.height - 114);
  ctx.font = '500 16px Space Grotesk, sans-serif';
  ctx.fillText(description, 48, state.height - 84);
}

export function createHostedGame(
  canvas: HTMLCanvasElement,
  config: RuntimeConfig,
  createHandlers: (context: RuntimeContext) => RuntimeHandlers,
) {
  const maybeCtx = canvas.getContext('2d');

  if (!maybeCtx) {
    throw new Error('Canvas 2D context is required');
  }

  const ctx = maybeCtx;

  const state: GameRuntimeState = {
    width: 640,
    height: 640 / config.aspectRatio,
    dpr: 1,
    running: false,
    started: false,
    finished: false,
    waitingReward: false,
    reviveAvailable: true,
    remainingMs: config.durationMs,
    elapsedMs: 0,
    score: 0,
    frame: 0,
    pointer: { x: 0, y: 0, pressed: false },
  };

  const context: RuntimeContext = {
    canvas,
    ctx,
    config,
    state,
    start,
    addScore,
    setScore,
    finishRound,
    clamp,
    random: (min, max) => min + Math.random() * (max - min),
  };

  const handlers = createHandlers(context);
  let lastFrame = performance.now();

  function start() {
    if (state.running || state.finished || state.waitingReward) {
      return;
    }

    state.running = true;

    if (!state.started) {
      state.started = true;
      notifyStart();
      handlers.onStart?.(context);
    }
  }

  function addScore(value: number) {
    state.score = Math.max(0, state.score + value);
  }

  function setScore(value: number) {
    state.score = Math.max(0, value);
  }

  function sendGameOver(reviveAvailable: boolean, metadata?: Record<string, unknown>) {
    submitScore({
      score: Math.round(state.score),
      playTimeMs: Math.round(state.elapsedMs),
      mode: config.mode,
      metadata: {
        reviveAvailable,
        ...metadata,
      },
    });
  }

  function finishRound(metadata?: Record<string, unknown>) {
    if (state.finished || state.waitingReward) {
      return;
    }

    state.running = false;

    if (state.reviveAvailable) {
      state.waitingReward = true;
      sendGameOver(true, metadata);
      requestRewardedAd(config.rewardReason ?? 'REVIVE');
      return;
    }

    state.finished = true;
    sendGameOver(false, metadata);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const maxWidth = config.maxWidth ?? Number.POSITIVE_INFINITY;
    const viewportWidth = Math.max(320, window.innerWidth - 12);
    const viewportHeight = Math.max(320, window.innerHeight - 12);
    const cssWidth = Math.min(viewportWidth, viewportHeight * config.aspectRatio, maxWidth);
    const cssHeight = cssWidth / config.aspectRatio;

    state.width = Math.round(cssWidth);
    state.height = Math.round(cssHeight);
    state.dpr = dpr;

    canvas.width = Math.round(state.width * dpr);
    canvas.height = Math.round(state.height * dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    handlers.onResize?.(context);
  }

  const onPointerDown = (event: MouseEvent | TouchEvent) => {
    const point = resolvePoint(canvas, event, state.width, state.height);
    state.pointer = { ...point, pressed: true };
    start();
    handlers.pointerDown?.(state.pointer, context);
  };

  const onPointerMove = (event: MouseEvent | TouchEvent) => {
    const point = resolvePoint(canvas, event, state.width, state.height);
    state.pointer = { ...point, pressed: state.pointer.pressed };
    handlers.pointerMove?.(state.pointer, context);
  };

  const onPointerUp = (event: MouseEvent | TouchEvent) => {
    const point = resolvePoint(canvas, event, state.width, state.height);
    state.pointer = { ...point, pressed: false };
    handlers.pointerUp?.(state.pointer, context);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    start();
    handlers.keyDown?.(event.code, context);
  };

  const onKeyUp = (event: KeyboardEvent) => {
    handlers.keyUp?.(event.code, context);
  };

  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('mouseleave', onPointerUp);
  canvas.addEventListener('touchstart', onPointerDown, { passive: true });
  canvas.addEventListener('touchmove', onPointerMove, { passive: true });
  canvas.addEventListener('touchend', onPointerUp, { passive: true });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', resize);

  onHostMessage((event) => {
    if (event.data.type === 'REWARD_GRANTED') {
      state.reviveAvailable = false;
      state.waitingReward = false;
      state.running = true;
      state.finished = false;
      state.remainingMs = config.reviveMs;
      handlers.onRevive?.(context);
    }

    if (event.data.type === 'REWARD_CANCELED') {
      state.waitingReward = false;
      state.finished = true;
      handlers.onRewardCanceled?.(context);
    }
  });

  function drawFrame(now: number) {
    const delta = Math.min(32, now - lastFrame);
    lastFrame = now;
    state.frame += 1;

    if (state.running) {
      state.remainingMs = Math.max(0, state.remainingMs - delta);
      state.elapsedMs += delta;
      handlers.update(delta, context);

      if (state.remainingMs <= 0) {
        finishRound({ reason: 'timer' });
      }
    }

    handlers.draw(context);
    drawHud(context);

    if (!state.started) {
      drawOverlayCard(context, '탭하거나 방향키로 시작', config.intro);
    } else if (state.waitingReward) {
      drawOverlayCard(context, '1회 이어하기 가능', '상단 모달에서 광고 시청을 선택하면 같은 판을 이어갈 수 있습니다.');
    } else if (state.finished) {
      drawOverlayCard(context, '결과 전송 완료', '랭킹 확인 또는 다시하기를 선택하세요.');
    }

    requestAnimationFrame(drawFrame);
  }

  resize();
  notifyReady();
  requestAnimationFrame(drawFrame);
}
