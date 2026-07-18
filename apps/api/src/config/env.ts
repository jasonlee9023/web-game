const port = Number.parseInt(process.env.PORT ?? '3001', 10);
const host = process.env.HOST ?? '0.0.0.0';
const logLevels = ['silent', 'error', 'warn', 'info', 'debug'] as const;

export type LogLevel = (typeof logLevels)[number];

function normalizeLogLevel(value: string | undefined): LogLevel {
  const normalizedValue = value?.toLowerCase();
  if (normalizedValue && logLevels.some((level) => level === normalizedValue)) {
    return normalizedValue as LogLevel;
  }

  return process.env.NODE_ENV === 'production' ? 'warn' : 'info';
}

function normalizePositiveInteger(value: string | undefined, fallback: number) {
  const parsedValue = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function normalizePublisherId(value: string) {
  return value.replace(/^ca-/, '');
}

const adsenseClientId = process.env.ADSENSE_CLIENT ?? process.env.ADSENSE_CLIENT_ID ?? '';
const adsensePublisherId = normalizePublisherId(process.env.ADSENSE_PUBLISHER_ID ?? adsenseClientId);

export const env = {
  host,
  port,
  serveWeb: process.env.SERVE_WEB !== 'false',
  webDistDir: process.env.WEB_DIST_DIR ?? 'apps/web/dist',
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5174',
  databasePath: process.env.DATABASE_PATH ?? 'data/casual-game-world.sqlite',
  accessTokenSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
  accessTokenTtlSeconds: 60 * 15,
  refreshTokenTtlSeconds: 60 * 60 * 24 * 7,
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@casualgame.world',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
  seedAdminDisplayName: process.env.SEED_ADMIN_DISPLAY_NAME ?? 'Arcade Admin',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
  geminiApiBaseUrl: process.env.GEMINI_API_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta',
  logLevel: normalizeLogLevel(process.env.LOG_LEVEL),
  logErrorStacks: process.env.LOG_ERROR_STACKS === 'true',
  logMaxMetaChars: normalizePositiveInteger(process.env.LOG_MAX_META_CHARS, 2000),
  adsenseClientId,
  adsensePublisherId,
  adsenseSlots: {
    homeTopBanner: process.env.ADSENSE_SLOT_HOME_TOP_BANNER ?? '',
    homeInFeed: process.env.ADSENSE_SLOT_HOME_IN_FEED ?? '',
    gameDetailRightRail: process.env.ADSENSE_SLOT_GAME_DETAIL_RIGHT_RAIL ?? '',
    gamePlayRightRail: process.env.ADSENSE_SLOT_GAME_PLAY_RIGHT_RAIL ?? '',
    rankingMidContent: process.env.ADSENSE_SLOT_RANKING_MID_CONTENT ?? '',
  },
};
