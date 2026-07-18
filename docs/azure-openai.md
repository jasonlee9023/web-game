# Azure OpenAI Level Generation

Hero Journey level generation can use Azure OpenAI instead of Gemini.

## Runtime Selection

Set `AI_LEVEL_PROVIDER`:

- `auto`: use Azure OpenAI when configured, otherwise Gemini, otherwise the local fallback planner.
- `azure-openai`: use Azure OpenAI only, then local fallback on error.
- `gemini`: use Gemini only, then local fallback on error.
- `local`: skip external AI calls.

Azure OpenAI environment variables:

- `AZURE_OPENAI_ENDPOINT`: resource endpoint, for example `https://oai-gamezip-prod-krc.openai.azure.com`
- `AZURE_OPENAI_API_KEY`: Azure OpenAI API key
- `AZURE_OPENAI_DEPLOYMENT`: deployed model name used by the app

Gemini variables are still supported:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_API_BASE_URL`

## Azure Setup

Run this after the subscription has permission to register `Microsoft.CognitiveServices`:

```bash
npm run azure:openai:setup
```

Defaults:

- Resource group: `rg-leeminsoft-prod-krc`
- Location: `koreacentral`
- Azure OpenAI account: `oai-gamezip-prod-krc`
- Deployment: `hero-level-planner`
- Model: `gpt-4o-mini`
- Model version: `2024-07-18`

Override any of these with environment variables:

```bash
AZURE_OPENAI_LOCATION=eastus \
AZURE_OPENAI_ACCOUNT_NAME=oai-gamezip-prod \
AZURE_OPENAI_DEPLOYMENT=hero-level-planner \
AZURE_OPENAI_MODEL_NAME=gpt-4o-mini \
AZURE_OPENAI_MODEL_VERSION=2024-07-18 \
npm run azure:openai:setup
```

The script creates the Azure OpenAI resource and deployment if missing, tests the chat completion endpoint, writes the production VM environment variables, reloads PM2, and verifies `/health`.
