#!/usr/bin/env bash
# ai_bundle_installer.sh
# Installer for AI CLI host (Python + Node + SQLite3 + JSON bridge)

set -euo pipefail
IFS=$'\n\t'

# === CONFIG ===
BASE_DIR="$HOME/_/ai"
ENV_DIR="$BASE_DIR/.env.local"
TMP_DIR="$BASE_DIR/tmp"
DB_DIR="$BASE_DIR/db"

echo "[Installer] Starting AI bundle installation..."

# --- Create directories ---
mkdir -p "$TMP_DIR" "$DB_DIR"

# --- Setup Python virtual environment ---
if [ ! -d "$ENV_DIR" ]; then
    echo "[Installer] Creating Python virtual environment..."
    python3 -m venv "$ENV_DIR"
fi

# --- Activate environment ---
source "$ENV_DIR/bin/activate"

# --- Install Python dependencies ---
echo "[Installer] Installing Python dependencies..."
pip install --upgrade pip
pip install aiohttp

# Note: sqlite3 is built-in in Python, no need to install

# --- Install Node.js dependencies ---
echo "[Installer] Installing Node.js dependencies..."
cd "$BASE_DIR"
# Ensure package.json exists
if [ ! -f package.json ]; then
    npm init -y
fi

# Install common CLI dependencies
npm install chalk

echo "[Installer] Installation complete."
echo "Activate environment with:"
echo "  source $ENV_DIR/bin/activate"
echo "Run AI cockpit using:"
echo "  $BASE_DIR/ai_cli_host_db.sh '<your prompt>'"
