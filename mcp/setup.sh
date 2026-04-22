#!/usr/bin/env bash
# One-shot setup for the reward MCP server.
# Creates a Python venv, installs reward deps, and installs Playwright's
# Chromium so reward_cli.py can render pages.
set -euo pipefail

cd "$(dirname "$0")/.."

PYTHON="${PYTHON:-python3}"

if [ ! -d .venv ]; then
  echo "Creating .venv with $PYTHON ..."
  "$PYTHON" -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r verifier/requirements.txt
python -m playwright install chromium

echo
echo "Done. Activate with:  source .venv/bin/activate"
echo "The reward MCP server will auto-detect .venv/bin/python."
