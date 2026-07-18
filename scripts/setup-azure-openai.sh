#!/usr/bin/env bash
set -euo pipefail

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-leeminsoft-prod-krc}"
LOCATION="${AZURE_OPENAI_LOCATION:-${AZURE_LOCATION:-koreacentral}}"
ACCOUNT_NAME="${AZURE_OPENAI_ACCOUNT_NAME:-oai-gamezip-prod-krc}"
DEPLOYMENT_NAME="${AZURE_OPENAI_DEPLOYMENT:-hero-level-planner}"
MODEL_NAME="${AZURE_OPENAI_MODEL_NAME:-gpt-4o-mini}"
MODEL_VERSION="${AZURE_OPENAI_MODEL_VERSION:-2024-07-18}"
SKU_NAME="${AZURE_OPENAI_SKU_NAME:-S0}"
DEPLOYMENT_SKU_NAME="${AZURE_OPENAI_DEPLOYMENT_SKU_NAME:-Standard}"
DEPLOYMENT_CAPACITY="${AZURE_OPENAI_DEPLOYMENT_CAPACITY:-1}"
VM_NAME="${AZURE_VM_NAME:-vm-playongym-prod}"
APP_DIR="${AZURE_VM_APP_DIR:-/opt/casual-game-world}"
SSH_KEY="${AZURE_SSH_KEY:-${HOME}/.ssh/id_ed25519}"

if [[ ! -f "$SSH_KEY" ]]; then
  echo "Missing SSH key: $SSH_KEY" >&2
  exit 1
fi

echo "Registering Microsoft.CognitiveServices provider if needed..."
az provider register --namespace Microsoft.CognitiveServices --wait --output none

az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none

if ! az cognitiveservices account show --resource-group "$RESOURCE_GROUP" --name "$ACCOUNT_NAME" --output none 2>/dev/null; then
  az cognitiveservices account create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACCOUNT_NAME" \
    --kind OpenAI \
    --sku "$SKU_NAME" \
    --location "$LOCATION" \
    --custom-domain "$ACCOUNT_NAME" \
    --yes \
    --output none
fi

if ! az cognitiveservices account deployment show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACCOUNT_NAME" \
  --deployment-name "$DEPLOYMENT_NAME" \
  --output none 2>/dev/null; then
  az cognitiveservices account deployment create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACCOUNT_NAME" \
    --deployment-name "$DEPLOYMENT_NAME" \
    --model-format OpenAI \
    --model-name "$MODEL_NAME" \
    --model-version "$MODEL_VERSION" \
    --sku-name "$DEPLOYMENT_SKU_NAME" \
    --sku-capacity "$DEPLOYMENT_CAPACITY" \
    --output none
fi

AZURE_OPENAI_ENDPOINT="$(az cognitiveservices account show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACCOUNT_NAME" \
  --query 'properties.endpoint' \
  --output tsv)"
AZURE_OPENAI_ENDPOINT="${AZURE_OPENAI_ENDPOINT%/}"
AZURE_OPENAI_API_KEY="$(az cognitiveservices account keys list \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACCOUNT_NAME" \
  --query 'key1' \
  --output tsv)"

echo "Testing Azure OpenAI deployment..."
curl -fsS "${AZURE_OPENAI_ENDPOINT}/openai/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "api-key: ${AZURE_OPENAI_API_KEY}" \
  -d "{
    \"model\": \"${DEPLOYMENT_NAME}\",
    \"messages\": [
      {\"role\": \"system\", \"content\": \"Return compact JSON only.\"},
      {\"role\": \"user\", \"content\": \"Return {\\\"ok\\\":true}.\"}
    ],
    \"max_tokens\": 30,
    \"response_format\": {\"type\": \"json_object\"}
  }" >/dev/null

VM_USER="$(az vm show --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --query 'osProfile.adminUsername' --output tsv)"
VM_HOST="$(az vm show --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" -d --query 'publicIps' --output tsv)"
SSH_ARGS=(-i "$SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)

ssh "${SSH_ARGS[@]}" "$VM_USER@$VM_HOST" \
  "APP_DIR='$APP_DIR' AI_LEVEL_PROVIDER='azure-openai' AZURE_OPENAI_ENDPOINT='$AZURE_OPENAI_ENDPOINT' AZURE_OPENAI_API_KEY='$AZURE_OPENAI_API_KEY' AZURE_OPENAI_DEPLOYMENT='$DEPLOYMENT_NAME' bash -s" <<'REMOTE_SCRIPT'
set -euo pipefail

ENV_FILE="${APP_DIR}/shared/.env.production.local"
if [ ! -f "$ENV_FILE" ]; then
  echo "Missing production env file: $ENV_FILE" >&2
  exit 1
fi

upsert_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"
  local temp_file
  temp_file="$(mktemp)"
  awk -v key="$key" -v value="$value" '
    BEGIN { replaced = 0 }
    $0 ~ "^" key "=" {
      print key "=" value
      replaced = 1
      next
    }
    { print }
    END {
      if (!replaced) {
        print key "=" value
      }
    }
  ' "$file" > "$temp_file"
  cat "$temp_file" > "$file"
  rm -f "$temp_file"
}

upsert_env_value "$ENV_FILE" AI_LEVEL_PROVIDER "$AI_LEVEL_PROVIDER"
upsert_env_value "$ENV_FILE" AZURE_OPENAI_ENDPOINT "$AZURE_OPENAI_ENDPOINT"
upsert_env_value "$ENV_FILE" AZURE_OPENAI_API_KEY "$AZURE_OPENAI_API_KEY"
upsert_env_value "$ENV_FILE" AZURE_OPENAI_DEPLOYMENT "$AZURE_OPENAI_DEPLOYMENT"

cd "${APP_DIR}/current"
pm2 startOrReload ecosystem.config.cjs --env production --update-env
pm2 save
curl -fsS http://127.0.0.1:3001/health
REMOTE_SCRIPT

echo "Azure OpenAI configured for Hero Journey level generation."
echo "Endpoint: ${AZURE_OPENAI_ENDPOINT}"
echo "Deployment: ${DEPLOYMENT_NAME}"
