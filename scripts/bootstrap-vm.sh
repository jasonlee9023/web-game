#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/web-game}"
RELEASE_DIR="${APP_DIR}/current"
REPO_URL="${REPO_URL:-https://github.com/jasonlee9023/web-game.git}"
BRANCH="${BRANCH:-main}"
NODE_MAJOR="${NODE_MAJOR:-22}"
APP_PORT="${APP_PORT:-3001}"
WEB_ORIGIN="${WEB_ORIGIN:-https://gamezip.kr}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl git nginx openssl logrotate

  if ! command -v node >/dev/null 2>&1 || ! node -e "process.exit(Number(process.versions.node.split('.')[0]) >= ${NODE_MAJOR} ? 0 : 1)"; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
fi

sudo npm install -g pm2
pm2 install pm2-logrotate >/dev/null 2>&1 || pm2 module:install pm2-logrotate >/dev/null 2>&1 || true
pm2 set pm2-logrotate:max_size 10M >/dev/null
pm2 set pm2-logrotate:retain 7 >/dev/null
pm2 set pm2-logrotate:compress true >/dev/null
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss >/dev/null
pm2 set pm2-logrotate:workerInterval 30 >/dev/null
pm2 set pm2-logrotate:rotateInterval '0 0 * * *' >/dev/null
pm2 set pm2-logrotate:rotateModule true >/dev/null
sudo mkdir -p "${APP_DIR}"
sudo chown -R "$(id -un):$(id -gn)" "${APP_DIR}"

if [ ! -d "${RELEASE_DIR}/.git" ]; then
  rm -rf "${RELEASE_DIR}"
  git clone --branch "${BRANCH}" "${REPO_URL}" "${RELEASE_DIR}"
else
  git -C "${RELEASE_DIR}" fetch origin "${BRANCH}"
  git -C "${RELEASE_DIR}" checkout "${BRANCH}"
  git -C "${RELEASE_DIR}" pull --ff-only origin "${BRANCH}"
fi

if [ ! -f "${RELEASE_DIR}/.env.production.local" ]; then
  cat > "${RELEASE_DIR}/.env.production.local" <<EOF
HOST=0.0.0.0
PORT=${APP_PORT}
WEB_ORIGIN=${WEB_ORIGIN}
WEB_DIST_DIR=apps/web/dist
SERVE_WEB=true
AI_LEVEL_PROVIDER=auto
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
# AZURE_OPENAI_API_KEY=your-api-key
# AZURE_OPENAI_DEPLOYMENT=your-deployment-name
LOG_LEVEL=warn
LOG_ERROR_STACKS=false
LOG_MAX_META_CHARS=2000
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
# ADSENSE_CLIENT=ca-pub-0000000000000000
# ADSENSE_PUBLISHER_ID=pub-0000000000000000
# ADSENSE_SLOT_HOME_TOP_BANNER=0000000000
# ADSENSE_SLOT_HOME_IN_FEED=0000000000
# ADSENSE_SLOT_GAME_DETAIL_RIGHT_RAIL=0000000000
# ADSENSE_SLOT_GAME_PLAY_RIGHT_RAIL=0000000000
# ADSENSE_SLOT_RANKING_MID_CONTENT=0000000000
EOF
fi

cd "${RELEASE_DIR}"
npm ci
npm run build
npm run pm2:start
sudo env PATH="$PATH" pm2 startup systemd -u "$(id -un)" --hp "$HOME"
npm run pm2:save

NGINX_BIN="$(command -v nginx || command -v /usr/sbin/nginx || true)"
if [ -n "${NGINX_BIN}" ]; then
  sudo tee /etc/nginx/sites-available/gamezip.kr >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name gamezip.kr www.gamezip.kr;

    client_max_body_size 10m;
    access_log /var/log/nginx/gamezip.access.log combined buffer=64k flush=5m;
    error_log /var/log/nginx/gamezip.error.log warn;

    location = /health {
        access_log off;
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
  sudo ln -sfn /etc/nginx/sites-available/gamezip.kr /etc/nginx/sites-enabled/gamezip.kr
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo "${NGINX_BIN}" -t
  sudo systemctl reload nginx
fi

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get install -y certbot python3-certbot-nginx

  CERTBOT_ARGS=(--nginx --non-interactive --agree-tos --redirect -d gamezip.kr -d www.gamezip.kr)
  if [ -n "${CERTBOT_EMAIL}" ]; then
    CERTBOT_ARGS+=(--email "${CERTBOT_EMAIL}")
  else
    CERTBOT_ARGS+=(--register-unsafely-without-email)
  fi

  sudo certbot "${CERTBOT_ARGS[@]}" || true
fi

pm2 status web-game
