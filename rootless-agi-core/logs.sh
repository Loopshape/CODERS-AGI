#!/bin/bash
# Tails the logs for the AGI server.
echo "[*] Tailing logs for the AGI server... (Press Ctrl+C to exit)"
./node_modules/.bin/pm2 logs rootless-agi-server
