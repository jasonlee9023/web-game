import type { CreateMultiplayerRoomInput, JoinMultiplayerRoomInput } from '@casual-game-world/shared';

import { store } from '../../data/store';

type Identity = {
  userId?: string;
  guestId?: string;
  displayName?: string;
};

export class MultiplayerService {
  listRooms(gameSlug: string) {
    return store.listMultiplayerRooms(gameSlug);
  }

  createRoom(payload: CreateMultiplayerRoomInput, identity: Identity) {
    return store.createMultiplayerRoom(payload, identity);
  }

  getRoom(roomId: string) {
    return store.getMultiplayerRoomForJoin(roomId);
  }

  joinRoom(roomId: string, payload: JoinMultiplayerRoomInput, identity: Identity) {
    return store.joinMultiplayerRoom(roomId, payload, identity);
  }

  heartbeat(roomId: string, identity: Identity) {
    return store.heartbeatMultiplayerRoom(roomId, identity);
  }

  closeRoom(roomId: string, identity: Identity) {
    return store.closeMultiplayerRoom(roomId, identity);
  }
}

export const multiplayerService = new MultiplayerService();

