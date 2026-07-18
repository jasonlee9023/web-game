#!/usr/bin/env bash
set -euo pipefail

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-leeminsoft-prod-krc}"
VM_NAME="${AZURE_VM_NAME:-vm-playongym-prod}"
APP_DIR="${AZURE_VM_APP_DIR:-/opt/casual-game-world}"
APP_PORT="${AZURE_VM_APP_PORT:-3001}"
WEB_ORIGIN="${AZURE_WEB_ORIGIN:-https://gamezip.kr}"
DOMAIN_NAMES="${AZURE_DOMAIN_NAMES:-gamezip.kr www.gamezip.kr}"
SSH_KEY="${AZURE_SSH_KEY:-${HOME}/.ssh/id_ed25519}"
SSH_PUB_KEY="${AZURE_SSH_PUB_KEY:-${SSH_KEY}.pub}"
PACKAGE_PATH=".azure-deploy/casual-game-world-app.zip"
ENV_PATH=".azure-deploy/production.env"
PLAYONGYM_ENV="${PLAYONGYM_ENV_PATH:-/Users/jongminlee/git/leeminsoft/playongym/playongym_server/.env}"

read_env_value() {
  local key="$1"
  local file="$2"
  if [[ ! -f "$file" ]]; then
    return 0
  fi
  awk -F= -v key="$key" '$1 == key { value = substr($0, index($0, "=") + 1); gsub(/^"|"$/, "", value); gsub(/^'\''|'\''$/, "", value); print value; exit }' "$file"
}

generate_secret() {
  openssl rand -base64 48 | tr -d '\n'
}

write_env_file() {
  local target="$1"
  umask 077
  {
    printf 'HOST=0.0.0.0\n'
    printf 'PORT=%s\n' "$APP_PORT"
    printf 'WEB_ORIGIN=%s\n' "$WEB_ORIGIN"
    printf 'WEB_DIST_DIR=apps/web/dist\n'
    printf 'SERVE_WEB=true\n'
    printf 'LOG_LEVEL=%s\n' "${LOG_LEVEL:-warn}"
    printf 'LOG_ERROR_STACKS=%s\n' "${LOG_ERROR_STACKS:-false}"
    printf 'LOG_MAX_META_CHARS=%s\n' "${LOG_MAX_META_CHARS:-2000}"
    printf 'DATABASE_PATH=%s/shared/data/casual-game-world.sqlite\n' "$APP_DIR"
    printf 'JWT_ACCESS_SECRET=%s\n' "${JWT_ACCESS_SECRET:-$(generate_secret)}"
    printf 'JWT_REFRESH_SECRET=%s\n' "${JWT_REFRESH_SECRET:-$(generate_secret)}"
    printf 'SEED_ADMIN_EMAIL=%s\n' "${SEED_ADMIN_EMAIL:-admin@casualgame.world}"
    printf 'SEED_ADMIN_PASSWORD=%s\n' "${SEED_ADMIN_PASSWORD:-$(generate_secret)}"
    printf 'SEED_ADMIN_DISPLAY_NAME=%s\n' "${SEED_ADMIN_DISPLAY_NAME:-Arcade Admin}"
    printf 'GEMINI_API_KEY=%s\n' "${GEMINI_API_KEY:-$(read_env_value GEMINI_API_KEY "$PLAYONGYM_ENV")}"
    printf 'GEMINI_MODEL=%s\n' "${GEMINI_MODEL:-gemini-2.0-flash}"
    printf 'GEMINI_API_BASE_URL=%s\n' "${GEMINI_API_BASE_URL:-https://generativelanguage.googleapis.com/v1beta}"
  } > "$target"
}

if [[ ! -f "$SSH_KEY" || ! -f "$SSH_PUB_KEY" ]]; then
  echo "Missing SSH key or public key: $SSH_KEY" >&2
  exit 1
fi

node scripts/package-azure-app.mjs
write_env_file "$ENV_PATH"
trap 'rm -f "$ENV_PATH"' EXIT

VM_USER="$(az vm show --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --query 'osProfile.adminUsername' --output tsv)"
VM_HOST="$(az vm show --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" -d --query 'publicIps' --output tsv)"
PUBLIC_KEY="$(cat "$SSH_PUB_KEY")"

az vm run-command invoke \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --command-id RunShellScript \
  --scripts "
set -euo pipefail
install -d -m 700 -o '$VM_USER' -g '$VM_USER' '/home/$VM_USER/.ssh'
touch '/home/$VM_USER/.ssh/authorized_keys'
chown '$VM_USER:$VM_USER' '/home/$VM_USER/.ssh/authorized_keys'
chmod 600 '/home/$VM_USER/.ssh/authorized_keys'
printf '%s\n' '$PUBLIC_KEY' >> '/home/$VM_USER/.ssh/authorized_keys'
sort -u '/home/$VM_USER/.ssh/authorized_keys' -o '/home/$VM_USER/.ssh/authorized_keys'
chown '$VM_USER:$VM_USER' '/home/$VM_USER/.ssh/authorized_keys'
" \
  --output none

SSH_ARGS=(-i "$SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)
ssh "${SSH_ARGS[@]}" "$VM_USER@$VM_HOST" 'mkdir -p /tmp/casual-game-world-deploy'
scp "${SSH_ARGS[@]}" "$PACKAGE_PATH" "$ENV_PATH" "$VM_USER@$VM_HOST:/tmp/casual-game-world-deploy/"

ssh "${SSH_ARGS[@]}" "$VM_USER@$VM_HOST" \
  "APP_DIR='$APP_DIR' APP_PORT='$APP_PORT' WEB_ORIGIN='$WEB_ORIGIN' DOMAIN_NAMES='$DOMAIN_NAMES' bash -s" <<'REMOTE_SCRIPT'
set -euo pipefail

RELEASE_ID="$(date +%Y%m%d%H%M%S)"
RELEASE_DIR="${APP_DIR}/releases/${RELEASE_ID}"
CURRENT_DIR="${APP_DIR}/current"
SHARED_DIR="${APP_DIR}/shared"
DEPLOY_DIR="/tmp/casual-game-world-deploy"

ensure_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"
  if ! grep -q "^${key}=" "$file"; then
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

configure_pm2_logrotate() {
  pm2 install pm2-logrotate >/dev/null 2>&1 || pm2 module:install pm2-logrotate >/dev/null 2>&1 || true
  pm2 set pm2-logrotate:max_size 10M >/dev/null
  pm2 set pm2-logrotate:retain 7 >/dev/null
  pm2 set pm2-logrotate:compress true >/dev/null
  pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss >/dev/null
  pm2 set pm2-logrotate:workerInterval 30 >/dev/null
  pm2 set pm2-logrotate:rotateInterval '0 0 * * *' >/dev/null
  pm2 set pm2-logrotate:rotateModule true >/dev/null
}

configure_system_log_limits() {
  if command -v logrotate >/dev/null 2>&1 && [ ! -f /etc/logrotate.d/nginx ]; then
    sudo tee /etc/logrotate.d/nginx >/dev/null <<'EOF'
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -s /run/nginx.pid ] && kill -USR1 "$(cat /run/nginx.pid)"
    endscript
}
EOF
  fi

  if command -v systemctl >/dev/null 2>&1; then
    sudo mkdir -p /etc/systemd/journald.conf.d
    sudo tee /etc/systemd/journald.conf.d/casual-game-world.conf >/dev/null <<'EOF'
[Journal]
SystemMaxUse=200M
SystemKeepFree=500M
MaxRetentionSec=14day
EOF
    sudo systemctl restart systemd-journald || true
  fi
}

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl unzip nginx logrotate

  NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])" 2>/dev/null || echo 0)"
  if [ "$NODE_MAJOR" -lt 24 ]; then
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
fi

sudo npm install -g pm2
configure_pm2_logrotate
configure_system_log_limits
sudo mkdir -p "${APP_DIR}/releases" "${SHARED_DIR}/data"
sudo chown -R "$(id -un):$(id -gn)" "${APP_DIR}"

mkdir -p "$RELEASE_DIR"
unzip -q "${DEPLOY_DIR}/casual-game-world-app.zip" -d "$RELEASE_DIR"

if [ ! -f "${SHARED_DIR}/.env.production.local" ]; then
  cp "${DEPLOY_DIR}/production.env" "${SHARED_DIR}/.env.production.local"
  chmod 600 "${SHARED_DIR}/.env.production.local"
fi
ensure_env_value "${SHARED_DIR}/.env.production.local" LOG_LEVEL warn
ensure_env_value "${SHARED_DIR}/.env.production.local" LOG_ERROR_STACKS false
ensure_env_value "${SHARED_DIR}/.env.production.local" LOG_MAX_META_CHARS 2000

ln -sfn "${SHARED_DIR}/.env.production.local" "${RELEASE_DIR}/.env.production.local"
ln -sfn "$RELEASE_DIR" "$CURRENT_DIR"

CERT_DOMAIN="${DOMAIN_NAMES%% *}"
SSL_CERT_PATH="/etc/letsencrypt/live/${CERT_DOMAIN}/fullchain.pem"
SSL_KEY_PATH="/etc/letsencrypt/live/${CERT_DOMAIN}/privkey.pem"

if sudo test -f "$SSL_CERT_PATH" && sudo test -f "$SSL_KEY_PATH"; then
  SSL_OPTIONS=""
  SSL_DHPARAM=""
  if sudo test -f /etc/letsencrypt/options-ssl-nginx.conf; then
    SSL_OPTIONS="    include /etc/letsencrypt/options-ssl-nginx.conf;"
  fi
  if sudo test -f /etc/letsencrypt/ssl-dhparams.pem; then
    SSL_DHPARAM="    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;"
  fi

  sudo tee /etc/nginx/sites-available/gamezip.kr >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_NAMES};

    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ${DOMAIN_NAMES};

    ssl_certificate ${SSL_CERT_PATH};
    ssl_certificate_key ${SSL_KEY_PATH};
${SSL_OPTIONS}
${SSL_DHPARAM}

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
else
  sudo tee /etc/nginx/sites-available/gamezip.kr >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_NAMES};

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
fi

sudo ln -sfn /etc/nginx/sites-available/gamezip.kr /etc/nginx/sites-enabled/gamezip.kr
sudo nginx -t
sudo systemctl reload nginx

cd "$CURRENT_DIR"
pm2 startOrReload ecosystem.config.cjs --env production --update-env
pm2 save
sudo env PATH="$PATH" pm2 startup systemd -u "$(id -un)" --hp "$HOME" >/dev/null || true

for attempt in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${APP_PORT}/health"; then
    break
  fi
  if [ "$attempt" -eq 20 ]; then
    echo "Health check failed after ${attempt} attempts" >&2
    exit 1
  fi
  sleep 1
done
pm2 status casual-game-world
REMOTE_SCRIPT

echo "Azure VM deployment complete: http://${VM_HOST} (Host header: gamezip.kr)"
