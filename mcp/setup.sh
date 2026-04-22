#!/usr/bin/env bash
# One-shot setup for the reward MCP server + verify→write loop.
# JS-only: install node deps + Playwright's Chromium.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -d node_modules ]; then
  npm install
fi

npx playwright install chromium

echo
echo "Setup complete. Useful scripts:"
echo "  npm run mcp:server  — run the MCP server over stdio"
echo "  npm run mcp:agent   — one-shot Claude scoring agent"
echo "  npm run mcp:loop    — verify→write loop"
