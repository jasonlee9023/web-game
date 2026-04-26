import type { BridgeEvent, BridgeOptions, GameOverPayload } from './types';
import type { RewardReason } from '@casual-game-world/shared';

const DEFAULT_TARGET = '*';

function getTargetOrigin(options?: BridgeOptions) {
  return options?.parentOrigin ?? DEFAULT_TARGET;
}

export function emitGameEvent(event: BridgeEvent, options?: BridgeOptions) {
  window.parent.postMessage(event, getTargetOrigin(options));
}

export function notifyReady(options?: BridgeOptions) {
  emitGameEvent({ type: 'GAME_READY' }, options);
}

export function notifyStart(options?: BridgeOptions) {
  emitGameEvent({ type: 'GAME_START' }, options);
}

export function notifyPause(options?: BridgeOptions) {
  emitGameEvent({ type: 'GAME_PAUSE' }, options);
}

export function notifyResume(options?: BridgeOptions) {
  emitGameEvent({ type: 'GAME_RESUME' }, options);
}

export function submitScore(payload: GameOverPayload, options?: BridgeOptions) {
  emitGameEvent({ type: 'GAME_OVER', payload }, options);
}

export function requestRewardedAd(reason: RewardReason, options?: BridgeOptions) {
  emitGameEvent({ type: 'REQUEST_REWARDED_AD', payload: { reason } }, options);
}

export function notifyMultiplayerRoomCreated(roomId: string, options?: BridgeOptions) {
  emitGameEvent({ type: 'MULTIPLAYER_ROOM_CREATED', payload: { roomId } }, options);
}

export function notifyMultiplayerRoomCleared(options?: BridgeOptions) {
  emitGameEvent({ type: 'MULTIPLAYER_ROOM_CLEARED' }, options);
}

export function onHostMessage(
  callback: (event: MessageEvent<BridgeEvent>) => void,
  options?: BridgeOptions,
) {
  const handler = (event: MessageEvent<BridgeEvent>) => {
    if (options?.parentOrigin && event.origin !== options.parentOrigin) {
      return;
    }
    callback(event);
  };

  window.addEventListener('message', handler as EventListener);
  return () => window.removeEventListener('message', handler as EventListener);
}
