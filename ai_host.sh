#!/usr/bin/env bash
# ~/_/ai/ai_host.sh

# Ensure environment
export PYTHONUNBUFFERED=1
export NODE_PATH=$(npm root -g)

PROMPT="$*"
if [ -z "$PROMPT" ]; then
  read -p "Enter human prompt: " PROMPT
fi

echo "[NEXUS] ⚙️  Starting AI Crew Hyper-Reasoning..."
python3 "$HOME/_/ai/ai.py" "$PROMPT"
node "$HOME/_/ai/ai.js" "$PROMPT"
