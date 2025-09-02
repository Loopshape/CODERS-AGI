#!/bin/bash
# Starts the AGI server using the local PM2 instance.
echo "[*] Checking if Ollama service is running..."
if ! curl -s --head http://localhost:11434 >/dev/null; then
    echo "[!] Ollama is not running. Please start it in another terminal with: ollama serve"
    exit 1
fi
echo "[*] Starting the CODERS-AGI server with PM2..."
# Assuming the main script is server.js and ecosystem file exists in repo
# If not, PM2 can start the script directly
if [ -f "ecosystem.config.js" ]; then
    ${PM2_CMD} start ecosystem.config.js
else
    ${PM2_CMD} start server.js --name "coders-agi-server"
fi
