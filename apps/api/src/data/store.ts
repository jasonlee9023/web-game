import { randomUUID } from 'node:crypto';

import type {
  AdSlotConfig,
  CreateMultiplayerRoomInput,
  DashboardSummary,
  GameAnalyticsEvent,
  GameCatalogItem,
  HeroJourneyLevelCreateInput,
  HeroJourneyLevelSnapshot,
  HeroJourneyMapConfig,
  JoinMultiplayerRoomInput,
  MultiplayerRoomSignalResponse,
  MultiplayerRoomSummary,
  RankingEntry,
  RankingFilter,
  RankingPeriod,
  ScoreRecord,
  ScoreSubmissionInput,
} from '@casual-game-world/shared';

import { isoNow, isWithinPeriod } from '../utils/dates';
import { HttpError } from '../utils/http';
import {
  seedAdSlots,
  seedEvents,
  seedGames,
  seedHeroJourneyLevels,
  seedScores,
  seedUsers,
  type GameEntity,
  type SessionEntity,
  type UserEntity,
} from './seed';
import { database } from './database';

function actorKey(score: ScoreRecord) {
  return score.userId ? `user:${score.userId}` : `guest:${score.guestId ?? 'unknown'}`;
}

type MultiplayerRoomEntity = {
  id: string;
  gameSlug: string;
  title: string;
  hostUserId?: string;
  hostGuestId?: string;
  hostDisplayName: string;
  guestUserId?: string;
  guestGuestId?: string;
  guestDisplayName?: string;
  status: 'open' | 'joining' | 'connected';
  offer: string;
  answer?: string;
  createdAt: string;
  updatedAt: string;
  lastHeartbeatAt: string;
};

type ActorIdentity = {
  userId?: string;
  guestId?: string;
  displayName?: string;
};

type HeroJourneyLevelDefinition = Omit<HeroJourneyLevelSnapshot, 'map' | 'customized' | 'updatedAt'>;

const GAME_SLUG_ALIASES = new Map([['dungeon-quest', 'hero-journey']]);

function slugifyLevelId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function canonicalGameSlug(slug: string) {
  return GAME_SLUG_ALIASES.get(slug) ?? slug;
}

function multiplayerActorKey(identity: ActorIdentity) {
  return identity.userId ? `user:${identity.userId}` : `guest:${identity.guestId ?? 'unknown'}`;
}

function multiplayerHostActorKey(room: MultiplayerRoomEntity) {
  return multiplayerActorKey({
    userId: room.hostUserId,
    guestId: room.hostGuestId,
  });
}

export class DataStore {
  users: UserEntity[] = database.get<UserEntity[]>('users', seedUsers);

  games: GameEntity[] = database.get<GameEntity[]>('games', seedGames);

  sessions: SessionEntity[] = database.get<SessionEntity[]>('sessions', []);

  scores: ScoreRecord[] = database.get<ScoreRecord[]>('scores', seedScores);

  adSlots: AdSlotConfig[] = database.get<AdSlotConfig[]>('adSlots', seedAdSlots);

  events: GameAnalyticsEvent[] = database.get<GameAnalyticsEvent[]>('events', seedEvents);

  refreshTokens = new Map<string, string>(Object.entries(database.get<Record<string, string>>('refreshTokens', {})));

  multiplayerRooms: MultiplayerRoomEntity[] = [];

  heroJourneyLevelMaps = new Map<string, { map: HeroJourneyMapConfig; updatedAt: string }>(
    Object.entries(database.get<Record<string, { map: HeroJourneyMapConfig; updatedAt: string }>>('heroJourneyLevelMaps', {})),
  );

  heroJourneyCustomLevels: HeroJourneyLevelDefinition[] = database.get<HeroJourneyLevelDefinition[]>('heroJourneyCustomLevels', []);

  constructor() {
    setInterval(() => {
      this.pruneMultiplayerRooms();
    }, 5_000).unref();
  }

  persistUsers() {
    database.set('users', this.users);
  }

  saveRefreshToken(token: string, userId: string) {
    this.refreshTokens.set(token, userId);
    this.persistRefreshTokens();
  }

  hasRefreshToken(token: string) {
    return this.refreshTokens.has(token);
  }

  deleteRefreshToken(token: string) {
    this.refreshTokens.delete(token);
    this.persistRefreshTokens();
  }

  private persistGames() {
    database.set('games', this.games);
  }

  private persistSessions() {
    database.set('sessions', this.sessions);
  }

  private persistScores() {
    database.set('scores', this.scores);
  }

  private persistEvents() {
    database.set('events', this.events);
  }

  private persistRefreshTokens() {
    database.set('refreshTokens', Object.fromEntries(this.refreshTokens));
  }

  private persistHeroJourneyLevelMaps() {
    database.set('heroJourneyLevelMaps', Object.fromEntries(this.heroJourneyLevelMaps));
  }

  private persistHeroJourneyCustomLevels() {
    database.set('heroJourneyCustomLevels', this.heroJourneyCustomLevels);
  }

  getPublishedGames() {
    return this.games.filter((game) => game.status === 'published');
  }

  listMultiplayerRooms(gameSlug: string, identity?: ActorIdentity) {
    this.pruneMultiplayerRooms();
    const canonicalSlug = canonicalGameSlug(gameSlug);
    const actor = identity && (identity.userId || identity.guestId) ? multiplayerActorKey(identity) : null;

    return this.multiplayerRooms
      .filter((room) => room.gameSlug === canonicalSlug && room.status === 'open' && (!actor || multiplayerHostActorKey(room) !== actor))
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      .map((room) => this.roomToSummary(room));
  }

  createMultiplayerRoom(input: CreateMultiplayerRoomInput, identity: ActorIdentity) {
    this.pruneMultiplayerRooms();
    const game = this.getGameBySlug(input.gameSlug);

    if (!game || game.status !== 'published') {
      throw new HttpError(404, 'Game not found');
    }

    const actor = multiplayerActorKey(identity);
    this.multiplayerRooms = this.multiplayerRooms.filter((room) => multiplayerHostActorKey(room) !== actor);

    const now = isoNow();
    const room: MultiplayerRoomEntity = {
      id: randomUUID(),
      gameSlug: game.slug,
      title: input.title?.trim() || `${identity.displayName ?? 'Host'}의 방`,
      hostUserId: identity.userId,
      hostGuestId: identity.guestId,
      hostDisplayName: identity.displayName ?? 'Host',
      status: 'open',
      offer: input.offer,
      createdAt: now,
      updatedAt: now,
      lastHeartbeatAt: now,
    };

    this.multiplayerRooms.unshift(room);
    return {
      room: this.roomToSummary(room),
      offer: room.offer,
    } satisfies MultiplayerRoomSignalResponse;
  }

  getMultiplayerRoomForJoin(roomId: string, identity?: ActorIdentity) {
    this.pruneMultiplayerRooms();
    const room = this.multiplayerRooms.find((candidate) => candidate.id === roomId);

    if (!room) {
      throw new HttpError(404, 'Room not found');
    }

    const actor = identity && (identity.userId || identity.guestId) ? multiplayerActorKey(identity) : null;
    const hostActor = multiplayerHostActorKey(room);
    const guestActor =
      room.guestUserId || room.guestGuestId
        ? multiplayerActorKey({
            userId: room.guestUserId,
            guestId: room.guestGuestId,
          })
        : null;

    if (room.status === 'connected' && actor !== hostActor && actor !== guestActor) {
      throw new HttpError(409, 'Room is already full');
    }

    return {
      room: this.roomToSummary(room),
      offer: room.offer,
      answer: room.answer,
    } satisfies MultiplayerRoomSignalResponse;
  }

  joinMultiplayerRoom(roomId: string, payload: JoinMultiplayerRoomInput, identity: ActorIdentity) {
    this.pruneMultiplayerRooms();
    const room = this.multiplayerRooms.find((candidate) => candidate.id === roomId);

    if (!room) {
      throw new HttpError(404, 'Room not found');
    }

    const joiningActor = multiplayerActorKey(identity);
    if (joiningActor === multiplayerHostActorKey(room)) {
      throw new HttpError(400, 'Host cannot join their own room');
    }

    if (room.guestUserId || room.guestGuestId) {
      const existingGuestActor = multiplayerActorKey({
        userId: room.guestUserId,
        guestId: room.guestGuestId,
      });
      if (existingGuestActor !== joiningActor) {
        throw new HttpError(409, 'Room already has a guest');
      }
    }

    room.guestUserId = identity.userId;
    room.guestGuestId = identity.guestId;
    room.guestDisplayName = identity.displayName ?? 'Guest';
    room.answer = payload.answer;
    room.status = 'joining';
    room.updatedAt = isoNow();

    return {
      room: this.roomToSummary(room),
      offer: room.offer,
      answer: room.answer,
    } satisfies MultiplayerRoomSignalResponse;
  }

  heartbeatMultiplayerRoom(roomId: string, identity: ActorIdentity) {
    this.pruneMultiplayerRooms();
    const room = this.multiplayerRooms.find((candidate) => candidate.id === roomId);

    if (!room) {
      throw new HttpError(404, 'Room not found');
    }

    if (multiplayerActorKey(identity) !== multiplayerHostActorKey(room)) {
      throw new HttpError(403, 'Only the host can heartbeat this room');
    }

    room.lastHeartbeatAt = isoNow();
    room.updatedAt = room.lastHeartbeatAt;
    if (room.answer) {
      room.status = 'connected';
    }

    return {
      room: this.roomToSummary(room),
      answer: room.answer,
    } satisfies MultiplayerRoomSignalResponse;
  }

  closeMultiplayerRoom(roomId: string, identity: ActorIdentity) {
    this.pruneMultiplayerRooms();
    const room = this.multiplayerRooms.find((candidate) => candidate.id === roomId);
    if (!room) {
      return false;
    }

    const actor = multiplayerActorKey(identity);
    const hostActor = multiplayerHostActorKey(room);
    const guestActor = multiplayerActorKey({ userId: room.guestUserId, guestId: room.guestGuestId });

    if (actor === hostActor) {
      this.multiplayerRooms = this.multiplayerRooms.filter((candidate) => candidate.id !== roomId);
      return true;
    }

    if (actor === guestActor) {
      room.guestUserId = undefined;
      room.guestGuestId = undefined;
      room.guestDisplayName = undefined;
      room.answer = undefined;
      room.status = 'open';
      room.updatedAt = isoNow();
      return true;
    }

    throw new HttpError(403, 'Not allowed to close this room');
  }

  private roomToSummary(room: MultiplayerRoomEntity): MultiplayerRoomSummary {
    return {
      id: room.id,
      gameSlug: room.gameSlug,
      title: room.title,
      hostDisplayName: room.hostDisplayName,
      guestDisplayName: room.guestDisplayName,
      status: room.status,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      lastHeartbeatAt: room.lastHeartbeatAt,
    };
  }

  pruneMultiplayerRooms() {
    const cutoff = Date.now() - 20_000;
    this.multiplayerRooms = this.multiplayerRooms.filter((room) => new Date(room.lastHeartbeatAt).getTime() >= cutoff);
  }

  getGameBySlug(slug: string) {
    return this.games.find((game) => game.slug === canonicalGameSlug(slug));
  }

  getRelatedGames(slug: string) {
    const game = this.getGameBySlug(slug);
    if (!game) {
      return [];
    }

    return game.relatedSlugs
      .map((relatedSlug) => this.getGameBySlug(relatedSlug))
      .filter((value): value is GameEntity => Boolean(value));
  }

  listHeroJourneyLevels() {
    return this.getHeroJourneyLevelDefinitions().map((level) => this.buildHeroJourneyLevelSnapshot(level.id));
  }

  createHeroJourneyLevel(input: HeroJourneyLevelCreateInput) {
    const now = isoNow();
    const id = this.createUniqueHeroJourneyLevelId(input.id ?? input.name.en ?? input.name.ko);
    const name = {
      ko: input.name.ko.trim(),
      en: input.name.en.trim(),
    };
    const definition: HeroJourneyLevelDefinition = {
      id,
      name,
      biome: input.biome ?? 'ruin',
      quest: input.quest ?? {
        ko: `${name.ko}의 수호자를 정리하고 보물상자를 여세요.`,
        en: `Clear the guardians in ${name.en} and open the treasure chest.`,
      },
      intro: input.intro ?? {
        ko: `${name.ko} 레벨입니다. 배치된 몹을 정리하고 다음 길을 여세요.`,
        en: `${name.en}. Clear the placed enemies and open the next route.`,
      },
      clearText: input.clearText ?? {
        ko: `${name.ko} 클리어. 다음 레벨로 이동합니다.`,
        en: `${name.en} cleared. Moving to the next level.`,
      },
      custom: true,
      createdAt: now,
    };

    this.heroJourneyCustomLevels.push(definition);
    this.persistHeroJourneyCustomLevels();

    if (input.map) {
      this.heroJourneyLevelMaps.set(id, {
        map: structuredClone(input.map),
        updatedAt: now,
      });
      this.persistHeroJourneyLevelMaps();
    }

    return this.buildHeroJourneyLevelSnapshot(id);
  }

  saveHeroJourneyLevel(levelId: string, map: HeroJourneyMapConfig) {
    this.assertHeroJourneyLevel(levelId);
    this.heroJourneyLevelMaps.set(levelId, {
      map: structuredClone(map),
      updatedAt: isoNow(),
    });
    this.persistHeroJourneyLevelMaps();
    return this.buildHeroJourneyLevelSnapshot(levelId);
  }

  resetHeroJourneyLevel(levelId: string) {
    this.assertHeroJourneyLevel(levelId);
    this.heroJourneyLevelMaps.delete(levelId);
    this.persistHeroJourneyLevelMaps();
    return this.buildHeroJourneyLevelSnapshot(levelId);
  }

  private assertHeroJourneyLevel(levelId: string) {
    if (!this.getHeroJourneyLevelDefinitions().some((level) => level.id === levelId)) {
      throw new HttpError(404, 'Hero Journey level not found');
    }
  }

  private getHeroJourneyLevelDefinitions(): HeroJourneyLevelDefinition[] {
    return [...seedHeroJourneyLevels, ...this.heroJourneyCustomLevels];
  }

  private createUniqueHeroJourneyLevelId(value: string) {
    const baseId = slugifyLevelId(value) || 'custom-level';
    const existingIds = new Set(this.getHeroJourneyLevelDefinitions().map((level) => level.id));
    let candidate = baseId;
    let suffix = 2;

    while (existingIds.has(candidate)) {
      candidate = `${baseId}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private buildHeroJourneyLevelSnapshot(levelId: string): HeroJourneyLevelSnapshot {
    const level = this.getHeroJourneyLevelDefinitions().find((candidate) => candidate.id === levelId);
    if (!level) {
      throw new HttpError(404, 'Hero Journey level not found');
    }

    const saved = this.heroJourneyLevelMaps.get(levelId);
    return {
      ...level,
      map: saved ? structuredClone(saved.map) : undefined,
      customized: Boolean(saved),
      updatedAt: saved?.updatedAt,
    };
  }

  createSession(input: Omit<SessionEntity, 'sessionId' | 'seed' | 'startedAt' | 'status' | 'scoreSubmitted'>) {
    const session: SessionEntity = {
      sessionId: randomUUID(),
      gameId: input.gameId,
      gameSlug: input.gameSlug,
      seed: Math.random().toString(36).slice(2, 10),
      startedAt: isoNow(),
      status: 'active',
      scoreSubmitted: false,
      userId: input.userId,
      guestId: input.guestId,
      ipHash: input.ipHash,
      userAgentHash: input.userAgentHash,
    };
    this.sessions.unshift(session);
    this.persistSessions();
    return session;
  }

  submitScore(gameSlug: string, payload: ScoreSubmissionInput, identity: { userId?: string; guestId?: string }) {
    const game = this.getGameBySlug(gameSlug);

    if (!game) {
      throw new HttpError(404, 'Game not found');
    }

    const session = this.sessions.find((item) => item.sessionId === payload.sessionId && item.gameSlug === game.slug);

    if (!session) {
      throw new HttpError(404, 'Play session not found');
    }

    if (session.scoreSubmitted) {
      throw new HttpError(409, 'Score already submitted for this session');
    }

    if (payload.playTimeMs < game.validationRule.minPlayTimeMs) {
      throw new HttpError(400, 'Play time is too short for a valid score');
    }

    if (payload.score > game.validationRule.maxScore) {
      throw new HttpError(400, 'Score exceeds maximum validation range');
    }

    if (!game.validationRule.allowedModes.includes(payload.mode)) {
      throw new HttpError(400, 'Unsupported score mode');
    }

    session.scoreSubmitted = true;
    session.status = 'completed';
    session.endedAt = isoNow();

    const record: ScoreRecord = {
      id: randomUUID(),
      gameId: game.id,
      userId: identity.userId,
      guestId: identity.guestId,
      sessionId: payload.sessionId,
      score: payload.score,
      playTimeMs: payload.playTimeMs,
      mode: payload.mode,
      metadata: payload.metadata,
      checksum: payload.checksum,
      validationStatus: 'valid',
      submittedAt: isoNow(),
    };

    this.scores.unshift(record);
    game.playCount += 1;
    game.bestScore = Math.max(game.bestScore, payload.score);
    this.persistSessions();
    this.persistScores();
    this.persistGames();

    return record;
  }

  getBestScore(gameSlug: string, identity: { userId?: string; guestId?: string }) {
    const game = this.getGameBySlug(gameSlug);

    if (!game) {
      throw new HttpError(404, 'Game not found');
    }

    const scores = this.scores.filter((score) => {
      if (score.gameId !== game.id || score.validationStatus !== 'valid') {
        return false;
      }

      return identity.userId ? score.userId === identity.userId : score.guestId === identity.guestId;
    });

    if (scores.length === 0) {
      return null;
    }

    return scores.reduce((best, current) => (current.score > best.score ? current : best));
  }

  private buildRankingEntries(game: GameEntity, filter: RankingFilter) {
    const filtered = this.scores.filter((score) => {
      return (
        score.gameId === game.id &&
        score.validationStatus === 'valid' &&
        score.mode === filter.mode &&
        isWithinPeriod(score.submittedAt, filter.period)
      );
    });

    const bestByActor = new Map<string, ScoreRecord>();

    for (const score of filtered) {
      const key = actorKey(score);
      const current = bestByActor.get(key);

      if (!current || score.score > current.score) {
        bestByActor.set(key, score);
      }
    }

    return Array.from(bestByActor.values())
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return left.playTimeMs - right.playTimeMs;
      })
      .map((score, index) => ({
        rank: index + 1,
        scoreId: score.id,
        userId: score.userId,
        guestId: score.guestId,
        displayName: this.getDisplayName(score),
        score: score.score,
        playTimeMs: score.playTimeMs,
        mode: score.mode,
        submittedAt: score.submittedAt,
      })) satisfies RankingEntry[];
  }

  getGameRanking(slug: string, filter: RankingFilter, identity: { userId?: string; guestId?: string }) {
    const game = this.getGameBySlug(slug);

    if (!game) {
      throw new HttpError(404, 'Game not found');
    }

    const items = this.buildRankingEntries(game, filter);
    const myBest = items.find((item) =>
      identity.userId ? item.userId === identity.userId : identity.guestId ? item.guestId === identity.guestId : false,
    );

    return {
      game: {
        id: game.id,
        slug: game.slug,
        title: game.title,
        scoreOrder: game.scoreOrder,
      },
      filter,
      items,
      myBest,
    };
  }

  getGlobalRanking(period: RankingPeriod) {
    return {
      period,
      buckets: this.getPublishedGames().map((game) => ({
        gameSlug: game.slug,
        gameTitle: game.title,
        items: this.buildRankingEntries(game, { period, mode: game.modes[0] ?? 'normal' }).slice(0, 5),
      })),
    };
  }

  getMyScores(userId: string) {
    return this.scores
      .filter((score) => score.userId === userId)
      .map((score) => ({
        ...score,
        game: this.games.find((game) => game.id === score.gameId),
      }));
  }

  createEvent(event: Omit<GameAnalyticsEvent, 'id' | 'createdAt'>) {
    const record: GameAnalyticsEvent = {
      id: randomUUID(),
      createdAt: isoNow(),
      ...event,
    };
    this.events.unshift(record);
    this.persistEvents();
    return record;
  }

  getAdConfig(page: AdSlotConfig['page'], gameSlug?: string) {
    return this.adSlots.filter((slot) => slot.page === page && slot.enabled && (!slot.gameSlug || slot.gameSlug === gameSlug));
  }

  addGame(game: Omit<GameEntity, 'id' | 'playCount' | 'favoriteCount' | 'bestScore' | 'averageSessionSeconds' | 'publishedAt'>) {
    const entity: GameEntity = {
      ...game,
      id: randomUUID(),
      playCount: 0,
      favoriteCount: 0,
      bestScore: 0,
      averageSessionSeconds: 45,
      publishedAt: isoNow(),
    };

    this.games.unshift(entity);
    this.persistGames();
    return entity;
  }

  updateGame(gameId: string, patch: Partial<GameEntity>) {
    const index = this.games.findIndex((game) => game.id === gameId);
    if (index === -1) {
      throw new HttpError(404, 'Game not found');
    }
    this.games[index] = { ...this.games[index], ...patch };
    this.persistGames();
    return this.games[index];
  }

  getDashboardSummary(): DashboardSummary {
    return {
      games: this.games.length,
      publishedGames: this.games.filter((game) => game.status === 'published').length,
      scoresToday: this.scores.filter((score) => isWithinPeriod(score.submittedAt, 'daily')).length,
      activeAdSlots: this.adSlots.filter((slot) => slot.enabled).length,
    };
  }

  private getDisplayName(score: ScoreRecord) {
    if (score.userId) {
      return this.users.find((user) => user.id === score.userId)?.displayName ?? 'Player';
    }

    return score.guestId ? `Guest ${score.guestId.slice(-4).toUpperCase()}` : 'Guest';
  }
}

export const store = new DataStore();
