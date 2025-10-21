#!/bin/bash
# fix_qbits_db.sh
# Ensures qbits table has all required columns for Neuro & crew AI

DB_FILE="$HOME/_/ai/db/ai_memory.sqlite"

if [ ! -f "$DB_FILE" ]; then
    echo "[ERROR] SQLite DB not found at $DB_FILE"
    exit 1
fi

echo "[INFO] Checking qbits table schema..."

# Check if 'response' column exists
COLUMN_EXISTS=$(sqlite3 "$DB_FILE" "PRAGMA table_info(qbits);" | awk -F'|' '{print $2}' | grep -w response || echo "no")

if [ "$COLUMN_EXISTS" = "response" ]; then
    echo "[OK] Column 'response' already exists."
else
    echo "[INFO] Adding missing column 'response'..."
    sqlite3 "$DB_FILE" "ALTER TABLE qbits ADD COLUMN response TEXT;"
    echo "[DONE] Column 'response' added."
fi

# Optional: ensure other columns exist (agent,prompt,hash,iteration,timestamp,temp)
REQUIRED_COLS=(agent prompt hash iteration timestamp temp)
for col in "${REQUIRED_COLS[@]}"; do
    EXISTS=$(sqlite3 "$DB_FILE" "PRAGMA table_info(qbits);" | awk -F'|' '{print $2}' | grep -w "$col" || echo "no")
    if [ "$EXISTS" = "no" ]; then
        echo "[WARNING] Column '$col' missing! Consider recreating table with full schema."
    fi
done

echo "[SUCCESS] qbits table schema validated."
