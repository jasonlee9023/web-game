export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'banned' | 'deleted';
export type GameStatus = 'draft' | 'published' | 'archived';
export type EngineType = 'canvas' | 'webgl';
export type Orientation = 'portrait' | 'landscape' | 'responsive';
export type ScoreOrder = 'higher_better' | 'lower_better';
export type RankingPeriod = 'daily' | 'weekly' | 'monthly' | 'all';
export type AdDevice = 'desktop' | 'mobile';
export type ValidationStatus = 'pending' | 'valid' | 'suspicious' | 'rejected';
export type GameMode = 'normal' | 'hard' | 'time-attack';
export type RewardReason = 'REVIVE' | 'HINT' | 'BONUS';
export type AdPage = 'home' | 'game-detail' | 'game-play' | 'ranking' | 'global-ranking';
export type MultiplayerRoomStatus = 'open' | 'joining' | 'connected';
export type AdPosition =
  | 'top-banner'
  | 'in-feed'
  | 'right-rail'
  | 'mid-content'
  | 'bottom'
  | 'game-over'
  | 'mobile-anchor';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput extends LoginInput {
  displayName: string;
}

export interface GameManifest {
  slug: string;
  title: string;
  version: string;
  entry: string;
  engine: EngineType;
  orientation: Orientation;
  aspectRatio: string;
  inputs: Array<'touch' | 'keyboard' | 'mouse'>;
  score: {
    order: ScoreOrder;
    modes: GameMode[];
  };
}

export interface GameCatalogItem {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  bannerUrl: string;
  entryUrl: string;
  version: string;
  engineType: EngineType;
  orientation: Orientation;
  aspectRatio: string;
  inputs: Array<'touch' | 'keyboard' | 'mouse'>;
  status: GameStatus;
  scoreOrder: ScoreOrder;
  categories: string[];
  tags: string[];
  modes: GameMode[];
  featured: boolean;
  playCount: number;
  favoriteCount: number;
  bestScore: number;
  averageSessionSeconds: number;
  publishedAt: string;
}

export interface PlaySession {
  sessionId: string;
  gameId: string;
  gameSlug: string;
  seed: string;
  startedAt: string;
  status: 'active' | 'completed';
}

export interface ScoreSubmissionInput {
  sessionId: string;
  score: number;
  playTimeMs: number;
  mode: GameMode;
  metadata?: Record<string, unknown>;
  checksum?: string;
}

export interface ScoreRecord extends ScoreSubmissionInput {
  id: string;
  gameId: string;
  userId?: string;
  guestId?: string;
  validationStatus: ValidationStatus;
  submittedAt: string;
}

export interface RankingEntry {
  rank: number;
  scoreId: string;
  userId?: string;
  guestId?: string;
  displayName: string;
  score: number;
  playTimeMs: number;
  mode: GameMode;
  submittedAt: string;
}

export interface AdFrequencyCap {
  maxPerSession: number;
}

export interface AdSlotConfig {
  id: string;
  page: AdPage;
  position: AdPosition;
  provider: 'adsense' | 'demo';
  unitId: string;
  enabled: boolean;
  label: string;
  devices: AdDevice[];
  gameSlug?: string;
  frequencyCap: AdFrequencyCap;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ScoreValidationRule {
  minPlayTimeMs: number;
  maxScore: number;
  allowedModes: GameMode[];
}

export interface RankingFilter {
  period: RankingPeriod;
  mode: GameMode;
}

export interface RankingResponse {
  game: Pick<GameCatalogItem, 'id' | 'slug' | 'title' | 'scoreOrder'>;
  filter: RankingFilter;
  items: RankingEntry[];
  myBest?: RankingEntry;
}

export interface GlobalRankingBucket {
  gameSlug: string;
  gameTitle: string;
  items: RankingEntry[];
}

export interface GlobalRankingResponse {
  period: RankingPeriod;
  buckets: GlobalRankingBucket[];
}

export interface DashboardSummary {
  games: number;
  publishedGames: number;
  scoresToday: number;
  activeAdSlots: number;
}

export interface GameAnalyticsEvent {
  id: string;
  eventType: string;
  userId?: string;
  guestId?: string;
  gameId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface MultiplayerRoomSummary {
  id: string;
  gameSlug: string;
  title: string;
  hostDisplayName: string;
  guestDisplayName?: string;
  status: MultiplayerRoomStatus;
  createdAt: string;
  updatedAt: string;
  lastHeartbeatAt: string;
}

export interface CreateMultiplayerRoomInput {
  gameSlug: string;
  offer: string;
  title?: string;
}

export interface JoinMultiplayerRoomInput {
  answer: string;
}

export interface MultiplayerRoomSignalResponse {
  room: MultiplayerRoomSummary;
  offer?: string;
  answer?: string;
}
