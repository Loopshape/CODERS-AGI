#!/bin/bash
# Stops the AGI server using the local PM2 instance.
echo "[*] Stopping the Rootless AGI server..."
./node_modules/.bin/pm2 stop rootless-agi-server
