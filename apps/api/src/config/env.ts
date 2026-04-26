const port = Number.parseInt(process.env.PORT ?? '3001', 10);
const host = process.env.HOST ?? '0.0.0.0';

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
};
