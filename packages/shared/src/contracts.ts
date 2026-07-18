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
export type AdPage = 'home' | 'game-list' | 'game-detail' | 'game-play' | 'ranking' | 'global-ranking';
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
  clientId?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  fullWidthResponsive?: boolean;
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

export type LocalizedText = {
  ko: string;
  en: string;
};

export type HeroJourneyBiome = 'forest' | 'desert' | 'mountain' | 'ruin';
export type HeroJourneyEnemyKind =
  | 'guard'
  | 'scout'
  | 'spearman'
  | 'brute'
  | 'warden'
  | 'zombie'
  | 'captain'
  | 'giant'
  | 'skeleton'
  | 'demon';
export type HeroJourneyEnemyWeapon = 'sword' | 'spear';
export type HeroJourneyEnemyShield = 'round' | 'rectangle';

export interface HeroJourneyGridPoint {
  x: number;
  z: number;
}

export interface HeroJourneyMapEditorOrder {
  editorOrder?: number;
}

export interface HeroJourneyFloorTile extends HeroJourneyGridPoint, HeroJourneyMapEditorOrder {
  detail?: boolean;
}

export type HeroJourneyTerrainPaintKind =
  | 'desert'
  | 'field'
  | 'hill'
  | 'water'
  | 'grass'
  | 'flowers'
  | 'stone-path'
  | 'dirt-path';

export interface HeroJourneyTerrainPaint extends HeroJourneyGridPoint, HeroJourneyMapEditorOrder {
  kind: HeroJourneyTerrainPaintKind;
  level: number;
}

export interface HeroJourneyWallSegment extends HeroJourneyGridPoint, HeroJourneyMapEditorOrder {
  rotationQuarter: number;
  half?: boolean;
  narrow?: boolean;
  opening?: boolean;
}

export interface HeroJourneyProp extends HeroJourneyGridPoint, HeroJourneyMapEditorOrder {
  key: string;
  radius: number;
  rotationQuarter?: number;
}

export interface HeroJourneyCoin extends HeroJourneyGridPoint, HeroJourneyMapEditorOrder {
  value: number;
}

export interface HeroJourneyEnemy extends HeroJourneyGridPoint, HeroJourneyMapEditorOrder {
  hp: number;
  speed: number;
  value: number;
  kind?: HeroJourneyEnemyKind;
  weapon?: HeroJourneyEnemyWeapon;
  shield?: HeroJourneyEnemyShield;
  damage?: number;
  radius?: number;
  aggroRange?: number;
  attackRange?: number;
  attackIntervalMs?: number;
  scale?: number;
  rotationQuarter?: number;
}

export interface HeroJourneyMapConfig {
  floorTiles: HeroJourneyFloorTile[];
  terrainPaints?: HeroJourneyTerrainPaint[];
  walls: HeroJourneyWallSegment[];
  props: HeroJourneyProp[];
  coins: HeroJourneyCoin[];
  enemies: HeroJourneyEnemy[];
  playerSpawn: HeroJourneyGridPoint;
  chest: HeroJourneyGridPoint;
  gate: HeroJourneyGridPoint;
  exit: HeroJourneyGridPoint;
}

export interface HeroJourneyLevelSnapshot {
  id: string;
  name: LocalizedText;
  biome: HeroJourneyBiome;
  quest: LocalizedText;
  intro: LocalizedText;
  clearText: LocalizedText;
  map?: HeroJourneyMapConfig;
  customized: boolean;
  custom?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HeroJourneyLevelCreateInput {
  id?: string;
  name: LocalizedText;
  biome?: HeroJourneyBiome;
  quest?: LocalizedText;
  intro?: LocalizedText;
  clearText?: LocalizedText;
  map?: HeroJourneyMapConfig;
}

export interface HeroJourneyLevelGenerateInput {
  prompt?: string;
  imageDataUrl?: string;
}
