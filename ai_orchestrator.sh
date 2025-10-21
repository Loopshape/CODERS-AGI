#!/usr/bin/env bash
# AI Orchestrator: qbits ↔ JSON ↔ SQLite ↔ Ollama
BASE_DIR="$HOME/_/ai"
TMP_DIR="$BASE_DIR/tmp"
DB_PATH="$BASE_DIR/db/ai_memory.sqlite"

source "$BASE_DIR/.env/bin/activate"

PROMPT="$1"
TEMP="${2:-0.5}"
DEPTH="${3:-5}"

mkdir -p "$TMP_DIR"

echo "[ORCHESTRATOR] Starting AI orchestration..."
echo "[ORCHESTRATOR] Human prompt: $PROMPT | Temp: $TEMP | Depth: $DEPTH"

# 1️⃣ Run Python qbit handler
python3 "$BASE_DIR/ai.py" "$PROMPT" "$TEMP" "$DEPTH"

# 2️⃣ Export SQLite memory to JSON for agents
python3 - <<EOF
import sqlite3, json, os
DB="$DB_PATH"
TMP="$TMP_DIR"
conn = sqlite3.connect(DB)
c = conn.cursor()
c.execute("SELECT * FROM qbits")
rows = c.fetchall()
cols = [description[0] for description in c.description]
data = [dict(zip(cols,row)) for row in rows]
json_file = os.path.join(TMP,"memory_snapshot.json")
with open(json_file,"w") as f:
    json.dump(data,f, indent=2)
print(f"[ORCHESTRATOR] JSON snapshot written to {json_file}")
EOF

# 3️⃣ Run Node.js agent for DOM/DEX reflection
node "$BASE_DIR/ai.js" "$TMP_DIR/memory_snapshot.json"

echo "[ORCHESTRATOR] AI orchestration complete."
