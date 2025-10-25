#!/usr/bin/env bash
# migrate_qbits.sh — add missing columns to qbits for Neuro & roles
DB_FILE="$HOME/_/ai/qbit_store.db"

sqlite3 "$DB_FILE" <<SQL
ALTER TABLE qbits ADD COLUMN role TEXT;
ALTER TABLE qbits ADD COLUMN strain INTEGER DEFAULT 0;
ALTER TABLE qbits ADD COLUMN layer INTEGER DEFAULT 0;
ALTER TABLE qbits ADD COLUMN corner INTEGER DEFAULT 0;
ALTER TABLE qbits ADD COLUMN sector INTEGER DEFAULT 0;
SQL

echo "[LOG] Migration complete: qbits table updated for Neuro orchestration."
