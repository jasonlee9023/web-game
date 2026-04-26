import type { RewardReason } from '@casual-game-world/shared';

export interface GameOverPayload {
  score: number;
  playTimeMs: number;
  mode: 'normal' | 'hard' | 'time-attack';
  metadata?: Record<string, unknown>;
  checksum?: string;
}

export type BridgeEvent =
  | { type: 'GAME_READY' }
  | { type: 'GAME_START' }
  | { type: 'GAME_PAUSE' }
  | { type: 'GAME_RESUME' }
  | { type: 'GAME_OVER'; payload: GameOverPayload }
  | { type: 'REQUEST_REWARDED_AD'; payload: { reason: RewardReason } }
  | { type: 'MULTIPLAYER_ROOM_CREATED'; payload: { roomId: string } }
  | { type: 'MULTIPLAYER_ROOM_CLEARED' }
  | { type: 'MULTIPLAYER_JOIN_ROOM'; payload: { roomId: string } }
  | { type: 'REWARD_GRANTED'; payload: { reason: RewardReason } }
  | { type: 'REWARD_CANCELED'; payload: { reason: RewardReason } };

export interface BridgeOptions {
  parentOrigin?: string;
}
