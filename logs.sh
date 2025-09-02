#!/bin/bash
# Tails the logs for the AGI server.
echo "[*] Tailing logs for the AGI server... (Press Ctrl+C to exit)"
${PM2_CMD} logs --raw
