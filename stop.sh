#!/bin/bash
# Stops the AGI server using the local PM2 instance.
echo "[*] Stopping the CODERS-AGI server..."
${PM2_CMD} delete all || true # Stop and delete all managed processes
