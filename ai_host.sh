#!/bin/bash
# ai_host.sh - Orchestrate Python + Node.js AI agents

PROMPT="$*"
[ -z "$PROMPT" ] && read -rp "Enter human prompt: " PROMPT

# Temp folder for JSON outputs
TMP_DIR="$(pwd)/tmp"
mkdir -p "$TMP_DIR"

echo "[NEXUS] ⚙️ Generated entropy hash: $(date +%s | sha256sum | cut -c1-64)"
echo "[NEXUS] 🌡 Temperature set: 0.5, Recursion depth: 5"

# Run Python Neuro (hyper-reasoning)
python3 ./ai.py "$PROMPT" &

# Run Node.js Crew-AI pool
node ./ai.js "$PROMPT" &

wait
echo "[NEXUS] ✅ Hyper-reasoning completed. JSON outputs stored in $TMP_DIR"
