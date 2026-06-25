#!/bin/sh
set -e

mkdir -p /root/.hermes

if [ -n "$OPENROUTER_API_KEY" ]; then
  printf "OPENROUTER_API_KEY=%s\n" "$OPENROUTER_API_KEY" > /root/.hermes/.env
fi

echo "Starting Hermes MCP bridge on port 8765..."
exec npx -y supergateway \
  --stdio "hermes mcp serve --accept-hooks" \
  --port 8765
