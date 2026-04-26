const port = Number.parseInt(process.env.PORT ?? '3001', 10);
const host = process.env.HOST ?? '0.0.0.0';

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
  accessTokenSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
  accessTokenTtlSeconds: 60 * 15,
  refreshTokenTtlSeconds: 60 * 60 * 24 * 7,
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
