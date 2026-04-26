const fs = require('node:fs');
const path = require('node:path');

function loadLocalEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    process.env[key] ??= rawValue.replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadLocalEnv(path.resolve(__dirname, '.env.production.local'));

module.exports = {
  apps: [
    {
      name: 'web-game',
      script: 'node_modules/.bin/tsx',
      args: 'apps/api/src/server.ts',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        HOST: process.env.HOST ?? '0.0.0.0',
        PORT: process.env.PORT ?? '3001',
        WEB_ORIGIN: process.env.WEB_ORIGIN ?? 'https://gamezip.kr',
        WEB_DIST_DIR: process.env.WEB_DIST_DIR ?? 'apps/web/dist',
        SERVE_WEB: process.env.SERVE_WEB ?? 'true',
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'change-this-access-secret',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'change-this-refresh-secret',
        ADSENSE_CLIENT: process.env.ADSENSE_CLIENT ?? '',
        ADSENSE_CLIENT_ID: process.env.ADSENSE_CLIENT_ID ?? '',
        ADSENSE_PUBLISHER_ID: process.env.ADSENSE_PUBLISHER_ID ?? '',
        ADSENSE_SLOT_HOME_TOP_BANNER: process.env.ADSENSE_SLOT_HOME_TOP_BANNER ?? '',
        ADSENSE_SLOT_HOME_IN_FEED: process.env.ADSENSE_SLOT_HOME_IN_FEED ?? '',
        ADSENSE_SLOT_GAME_DETAIL_RIGHT_RAIL: process.env.ADSENSE_SLOT_GAME_DETAIL_RIGHT_RAIL ?? '',
        ADSENSE_SLOT_GAME_PLAY_RIGHT_RAIL: process.env.ADSENSE_SLOT_GAME_PLAY_RIGHT_RAIL ?? '',
        ADSENSE_SLOT_RANKING_MID_CONTENT: process.env.ADSENSE_SLOT_RANKING_MID_CONTENT ?? '',
      },
    },
  ],
};
