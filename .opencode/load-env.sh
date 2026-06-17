#!/bin/bash
# Cargar tokens MCP en el entorno
# Uso: source .opencode/load-env.sh

ENV_FILE="$(dirname "$0")/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
  echo "✅ MCP tokens cargados desde $ENV_FILE"
  echo "   GITHUB_TOKEN: ${GITHUB_TOKEN:0:15}..."
  echo "   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:15}..."
  echo "   VERCEL_TOKEN: ${VERCEL_TOKEN:0:15}..."
else
  echo "❌ No se encontró $ENV_FILE"
  echo "   Copiá .opencode/.env.example a .opencode/.env y completá los tokens"
fi
