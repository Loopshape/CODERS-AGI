#!/usr/bin/env bash
source "$HOME/_/.env.local/bin/activate"
PROMPT="$1"
[ -z "$PROMPT" ] && read -p "Enter human prompt: " PROMPT

echo "[Host] Running Python AI..."
python3 "$HOME/_/ai/ai.py" "$PROMPT"

echo "[Host] Running Node AI..."
node "$HOME/_/ai/ai.js"
