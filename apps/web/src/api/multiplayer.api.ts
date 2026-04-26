import type {
  CreateMultiplayerRoomInput,
  JoinMultiplayerRoomInput,
  MultiplayerRoomSignalResponse,
  MultiplayerRoomSummary,
} from '@casual-game-world/shared';

import { http } from './http';

const MULTIPLAYER_PEER_ID_KEY = 'cgw-multiplayer-peer-id';

function randomPeerId() {
  return `peer-${Math.random().toString(36).slice(2, 10)}`;
}

function getMultiplayerPeerId() {
  const existing = sessionStorage.getItem(MULTIPLAYER_PEER_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = randomPeerId();
  sessionStorage.setItem(MULTIPLAYER_PEER_ID_KEY, next);
  return next;
}

function multiplayerHeaders() {
  return {
    'x-multiplayer-peer-id': getMultiplayerPeerId(),
  };
}

export function fetchRooms(gameSlug: string) {
  const query = new URLSearchParams({ gameSlug });
  return http<MultiplayerRoomSummary[]>(`/api/multiplayer/rooms?${query.toString()}`, {
    headers: multiplayerHeaders(),
  });
}

export function createRoom(payload: CreateMultiplayerRoomInput) {
  return http<MultiplayerRoomSignalResponse>('/api/multiplayer/rooms', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: multiplayerHeaders(),
  });
}

export function fetchRoom(roomId: string) {
  return http<MultiplayerRoomSignalResponse>(`/api/multiplayer/rooms/${roomId}`, {
    headers: multiplayerHeaders(),
  });
}

export function joinRoom(roomId: string, payload: JoinMultiplayerRoomInput) {
  return http<MultiplayerRoomSignalResponse>(`/api/multiplayer/rooms/${roomId}/join`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: multiplayerHeaders(),
  });
}

export function heartbeatRoom(roomId: string) {
  return http<MultiplayerRoomSignalResponse>(`/api/multiplayer/rooms/${roomId}/heartbeat`, {
    method: 'POST',
    body: JSON.stringify({}),
    headers: multiplayerHeaders(),
  });
}

export function closeRoom(roomId: string) {
  return http<{ success: boolean }>(`/api/multiplayer/rooms/${roomId}`, {
    method: 'DELETE',
    headers: multiplayerHeaders(),
  });
}
