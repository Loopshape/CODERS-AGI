#!/bin/bash
# Host CLI to run Python + Node AI scripts

read -p "Enter human prompt: " PROMPT
if [[ -z "$PROMPT" ]]; then echo "Prompt empty!"; exit 1; fi

HASH=$(echo -n "$PROMPT$(date +%s%N)" | sha256sum | awk '{print $1}')
echo "[NEXUS] Hash: $HASH"

$AI/ai.py "$PROMPT" "$HASH" "$DB/qbits.db" "$AI/tmp" &
PY_PID=$!
$AI/ai.js "$PROMPT" "$HASH" "$DB/qbits.db" "$AI/tmp" &
JS_PID=$!

wait $PY_PID
wait $JS_PID

echo "[NEXUS] AI Crew finished. Check $AI/tmp for JSON output."
