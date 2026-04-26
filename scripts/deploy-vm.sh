#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-${DEPLOY_TARGET:-34.50.0.174}}"
APP_DIR="${APP_DIR:-/opt/web-game}"
REPO_URL="${REPO_URL:-https://github.com/jasonlee9023/web-game.git}"
BRANCH="${BRANCH:-main}"
WEB_ORIGIN="${WEB_ORIGIN:-https://gamezip.kr}"
APP_PORT="${APP_PORT:-3001}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

ssh "${TARGET}" "mkdir -p /tmp/web-game-deploy"
scp scripts/bootstrap-vm.sh "${TARGET}:/tmp/web-game-deploy/bootstrap-vm.sh"
ssh "${TARGET}" \
  "APP_DIR='${APP_DIR}' REPO_URL='${REPO_URL}' BRANCH='${BRANCH}' WEB_ORIGIN='${WEB_ORIGIN}' APP_PORT='${APP_PORT}' CERTBOT_EMAIL='${CERTBOT_EMAIL}' bash /tmp/web-game-deploy/bootstrap-vm.sh"
