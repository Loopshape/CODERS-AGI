#!/bin/bash
# AI Bundle Installer — sets up full CLI AI Cockpit

BASE="$HOME/_"
AI="$BASE/ai"
DB="$BASE/db"
TMP="$AI/tmp"
ENV_FILE="$BASE/.env.local"

echo "[Installer] Starting AI bundle installation..."

# 1. Create directories
mkdir -p "$AI" "$DB" "$TMP"

# 2. Create .env.local
if [[ ! -f "$ENV_FILE" ]]; then
    echo "Creating .env.local..."
    cat <<EOF > "$ENV_FILE"
# Environment config for 2244 AI Crew
BASE=$BASE
AI=$AI
DB=$DB/qbits.db
TMP=$TMP
EOF
fi

# 3. Check/install Python dependencies
echo "[Installer] Installing Python dependencies..."
python3 -m pip install --upgrade pip
python3 -m pip install --upgrade aiohttp sqlite3 || echo "[Warning] sqlite3 may be builtin"

# 4. Check/install Node.js dependencies
echo "[Installer] Installing Node.js dependencies..."
npm install -g fs-extra axios || echo "[Warning] Node packages installed globally"

# 5. Create default Python AI script
cat <<'PY' > "$AI/ai.py"
#!/usr/bin/env python3
import sys, os, json, sqlite3, hashlib, time

prompt = sys.argv[1]
hash_val = sys.argv[2]
db_file = sys.argv[3]
tmp_dir = sys.argv[4]

# Connect SQLite
conn = sqlite3.connect(db_file)
c = conn.cursor()
c.execute("""CREATE TABLE IF NOT EXISTS qbits (id INTEGER PRIMARY KEY, agent TEXT, hash TEXT, output TEXT)""")

# Example: process prompt
agents = ['core','loop','code','coin','2244','neuro']
for agent in agents:
    output = f"{agent} processed: {prompt} [{hash_val[:8]}]"
    # Store qbit
    c.execute("INSERT INTO qbits(agent, hash, output) VALUES (?,?,?)", (agent, hash_val, output))
    # Store JSON
    tmp_file = os.path.join(tmp_dir, f"{hash_val}_{agent}.json")
    with open(tmp_file,'w') as f: json.dump({'agent':agent,'output':output}, f)

conn.commit()
conn.close()
print("[PY] Qbits processed & JSON stored.")
PY

chmod +x "$AI/ai.py"

# 6. Create default Node.js AI script
cat <<'JS' > "$AI/ai.js"
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const [,, prompt, hash, dbFile, tmpDir] = process.argv;
const agents = ['core','loop','code','coin','2244','neuro'];

agents.forEach(agent => {
    const output = `${agent} JS processed: ${prompt} [${hash.slice(0,8)}]`;
    const file = path.join(tmpDir, `${hash}_${agent}_js.json`);
    fs.writeFileSync(file, JSON.stringify({agent, output}));
});
console.log("[JS] Qbits processed & JSON stored.");
JS

chmod +x "$AI/ai.js"

# 7. Create Bash CLI host script
cat <<'BASH' > "$AI/ai_host.sh"
#!/bin/bash
# Host CLI to run Python + Node AI scripts

read -p "Enter human prompt: " PROMPT
if [[ -z "$PROMPT" ]]; then echo "Prompt empty!"; exit 1; fi

HASH=$(echo -n "$PROMPT$(date +%s%N)" | sha256sum | awk '{print $1}')
echo "[NEXUS] Hash: $HASH"

$AI/ai.py "$PROMPT" "$HASH" "$DB/qbits.db" "$AI/tmp" &
PY_PID=$!
$AI/ai.js "$PROMPT" "$HASH" "$DB/qbits.db" "$AI/tmp" &
JS_PID=$!

wait $PY_PID
wait $JS_PID

echo "[NEXUS] AI Crew finished. Check $AI/tmp for JSON output."
BASH

chmod +x "$AI/ai_host.sh"

echo "[Installer] Installation complete. Run the AI cockpit using:"
echo "  source $ENV_FILE"
echo "  $AI/ai_host.sh"
