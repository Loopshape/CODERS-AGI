#!/bin/bash
# ai_bundle_installer.sh - full AI environment installer & DB patcher

echo "[Installer] Starting AI bundle installation..."

# --- 1. Create virtual environment ---
VENV_DIR="$HOME/_/.env.local"
if [ -d "$VENV_DIR" ]; then
    echo "[INFO] Virtual environment exists."
else
    echo "[INFO] Creating virtual environment at $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
fi

# Activate
source "$VENV_DIR/bin/activate" || { echo "[ERROR] Cannot activate venv."; exit 1; }

# --- 2. Install Python dependencies ---
echo "[Installer] Installing Python dependencies..."
pip install --upgrade pip
pip install aiohttp sqlite3 || echo "[Warning] sqlite3 is builtin, skip."

# --- 3. Install Node.js dependencies ---
echo "[Installer] Installing Node.js dependencies..."
cd "$HOME/_/ai" || exit
npm install chalk fs-extra

# --- 4. Patch qbits table in SQLite ---
DB_FILE="$HOME/_/ai/db/ai_memory.sqlite"
mkdir -p "$(dirname "$DB_FILE")"
if [ ! -f "$DB_FILE" ]; then
    echo "[Installer] Creating new AI memory database..."
    sqlite3 "$DB_FILE" "CREATE TABLE IF NOT EXISTS qbits (agent TEXT, prompt TEXT, hash TEXT, iteration INTEGER, response TEXT, timestamp REAL, temp REAL);"
else
    echo "[Installer] Patching existing AI memory..."
    COLUMN_EXISTS=$(sqlite3 "$DB_FILE" "PRAGMA table_info(qbits);" | awk -F'|' '{print $2}' | grep -w response || echo "no")
    if [ "$COLUMN_EXISTS" != "response" ]; then
        echo "[Installer] Adding missing 'response' column..."
        sqlite3 "$DB_FILE" "ALTER TABLE qbits ADD COLUMN response TEXT;"
    fi
fi

# --- 5. Finish installation ---
echo "[Installer] Installation complete."
echo "Activate environment: source $VENV_DIR/bin/activate"
echo "Run AI cockpit: $HOME/_/ai/ai_host.sh"
