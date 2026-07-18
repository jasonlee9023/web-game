#!/usr/bin/env bash
set -euo pipefail

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-leeminsoft-prod-krc}"
LOCATION="${AZURE_LOCATION:-koreacentral}"
PLAN_NAME="${AZURE_APP_SERVICE_PLAN:-asp-cgw-prod-krc}"
APP_NAME="${AZURE_WEBAPP_NAME:-gamezip-prod-krc}"
SKU="${AZURE_APP_SERVICE_SKU:-B1}"
RUNTIME="${AZURE_WEBAPP_RUNTIME:-NODE|24-lts}"
ZIP_PATH="${AZURE_PACKAGE_PATH:-.azure-deploy/casual-game-world-app.zip}"
WEB_ORIGIN="${AZURE_WEB_ORIGIN:-https://${APP_NAME}.azurewebsites.net}"
DATABASE_PATH="${AZURE_DATABASE_PATH:-/home/data/casual-game-world.sqlite}"
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

if [[ ! -f "$ZIP_PATH" ]]; then
  node scripts/package-azure-app.mjs
fi

JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-$(generate_secret)}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-$(generate_secret)}"
SEED_ADMIN_EMAIL="${SEED_ADMIN_EMAIL:-admin@casualgame.world}"
SEED_ADMIN_DISPLAY_NAME="${SEED_ADMIN_DISPLAY_NAME:-Arcade Admin}"
SEED_ADMIN_PASSWORD="${SEED_ADMIN_PASSWORD:-$(generate_secret)}"
GEMINI_API_KEY="${GEMINI_API_KEY:-$(read_env_value GEMINI_API_KEY "$PLAYONGYM_ENV")}"
GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.0-flash}"
GEMINI_API_BASE_URL="${GEMINI_API_BASE_URL:-https://generativelanguage.googleapis.com/v1beta}"
AI_LEVEL_PROVIDER="${AI_LEVEL_PROVIDER:-auto}"
AZURE_OPENAI_ENDPOINT="${AZURE_OPENAI_ENDPOINT:-${AZURE_OPENAI_BASE_URL:-}}"
AZURE_OPENAI_API_KEY="${AZURE_OPENAI_API_KEY:-}"
AZURE_OPENAI_DEPLOYMENT="${AZURE_OPENAI_DEPLOYMENT:-${AZURE_OPENAI_MODEL:-}}"
LOG_LEVEL="${LOG_LEVEL:-warn}"
LOG_ERROR_STACKS="${LOG_ERROR_STACKS:-false}"
LOG_MAX_META_CHARS="${LOG_MAX_META_CHARS:-2000}"

az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none

if ! az appservice plan show --resource-group "$RESOURCE_GROUP" --name "$PLAN_NAME" --output none 2>/dev/null; then
  az appservice plan create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$PLAN_NAME" \
    --location "$LOCATION" \
    --is-linux \
    --sku "$SKU" \
    --output none
fi

if ! az webapp show --resource-group "$RESOURCE_GROUP" --name "$APP_NAME" --output none 2>/dev/null; then
  az webapp create \
    --resource-group "$RESOURCE_GROUP" \
    --plan "$PLAN_NAME" \
    --name "$APP_NAME" \
    --runtime "$RUNTIME" \
    --output none
fi

az webapp config set \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME" \
  --linux-fx-version "$RUNTIME" \
  --startup-file "npm start" \
  --always-on true \
  --output none

az webapp config appsettings set \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME" \
  --settings \
    NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    SERVE_WEB=true \
    WEB_DIST_DIR=apps/web/dist \
    WEB_ORIGIN="$WEB_ORIGIN" \
    DATABASE_PATH="$DATABASE_PATH" \
    JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET" \
    JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
    SEED_ADMIN_EMAIL="$SEED_ADMIN_EMAIL" \
    SEED_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" \
    SEED_ADMIN_DISPLAY_NAME="$SEED_ADMIN_DISPLAY_NAME" \
    AI_LEVEL_PROVIDER="$AI_LEVEL_PROVIDER" \
    GEMINI_API_KEY="$GEMINI_API_KEY" \
    GEMINI_MODEL="$GEMINI_MODEL" \
    GEMINI_API_BASE_URL="$GEMINI_API_BASE_URL" \
    AZURE_OPENAI_ENDPOINT="$AZURE_OPENAI_ENDPOINT" \
    AZURE_OPENAI_API_KEY="$AZURE_OPENAI_API_KEY" \
    AZURE_OPENAI_DEPLOYMENT="$AZURE_OPENAI_DEPLOYMENT" \
    LOG_LEVEL="$LOG_LEVEL" \
    LOG_ERROR_STACKS="$LOG_ERROR_STACKS" \
    LOG_MAX_META_CHARS="$LOG_MAX_META_CHARS" \
  --output none

az webapp deploy \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME" \
  --src-path "$ZIP_PATH" \
  --type zip \
  --clean true \
  --restart true \
  --timeout 900000 \
  --output none

az webapp show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME" \
  --query "{name:name,defaultHostName:defaultHostName,state:state}" \
  --output table
