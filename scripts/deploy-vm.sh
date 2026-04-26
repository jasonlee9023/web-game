#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-${DEPLOY_TARGET:-34.50.0.174}}"
APP_DIR="${APP_DIR:-/opt/web-game}"
REPO_URL="${REPO_URL:-https://github.com/jasonlee9023/web-game.git}"
BRANCH="${BRANCH:-main}"
WEB_ORIGIN="${WEB_ORIGIN:-https://gamezip.kr}"
APP_PORT="${APP_PORT:-3001}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
SSH_KEY="${SSH_KEY:-${HOME}/.ssh/google_compute_engine}"

SSH_ARGS=()
if [ -f "${SSH_KEY}" ]; then
  SSH_ARGS=(-i "${SSH_KEY}" -o IdentitiesOnly=yes)
fi

ssh "${SSH_ARGS[@]}" "${TARGET}" "mkdir -p /tmp/web-game-deploy"
scp "${SSH_ARGS[@]}" scripts/bootstrap-vm.sh "${TARGET}:/tmp/web-game-deploy/bootstrap-vm.sh"
ssh "${SSH_ARGS[@]}" "${TARGET}" \
  "APP_DIR='${APP_DIR}' REPO_URL='${REPO_URL}' BRANCH='${BRANCH}' WEB_ORIGIN='${WEB_ORIGIN}' APP_PORT='${APP_PORT}' CERTBOT_EMAIL='${CERTBOT_EMAIL}' bash /tmp/web-game-deploy/bootstrap-vm.sh"
