#!/bin/bash
# Starts the AGI server using the local PM2 instance.
echo "[*] Checking if Ollama service is running..."
if ! curl -s --head http://localhost:11434 >/dev/null; then
    echo "[!] Ollama is not running. Please start it in another terminal with: ollama serve"
    exit 1
fi
echo "[*] Starting the Rootless AGI server with PM2..."
./node_modules/.bin/pm2 start ecosystem.config.js
