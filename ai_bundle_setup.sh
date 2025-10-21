#!/bin/bash
# Full AI Bundle Installer: Python3 + Node.js + SQLite3 + Neuro + Ollama bridge
set -e

BASE="$HOME/_"
AI="$BASE/ai"
DB="$BASE/db"
TMP="$AI/tmp"
ENV_FILE="$BASE/.env.local"

echo "[Installer] Starting full AI bundle installation..."

# Cleanup potential bad .env.local directory
if [[ -d "$ENV_FILE" ]]; then
    echo "[Installer] Removing incorrect .env.local directory..."
    rm -rf "$ENV_FILE"
fi

mkdir -p "$AI" "$DB" "$TMP"

# Create .env.local
if [[ ! -f "$ENV_FILE" ]]; then
    echo "[Installer] Creating .env.local..."
    cat <<EOF > "$ENV_FILE"
BASE=$BASE
AI=$AI
DB=$DB/qbits.db
TMP=$TMP
EOF
else
    echo "[Installer] .env.local exists, skipping creation."
fi

# Python dependencies
echo "[Installer] Installing Python dependencies..."
python3 -m pip install --upgrade pip
python3 -m pip install aiohttp

# Node.js dependencies
echo "[Installer] Installing Node.js dependencies..."
cd "$AI"
if [[ ! -f package.json ]]; then
    npm init -y
fi
npm install readline fs path util axios

# Create minimal ai.py with Neuro + qbit storage
PY_FILE="$AI/ai.py"
cat <<'EOF' > "$PY_FILE"
#!/usr/bin/env python3
import sys, sqlite3, json, os, hashlib, time

prompt = sys.argv[1]
hashval = sys.argv[2]
db_file = sys.argv[3]
tmp_dir = sys.argv[4]

os.makedirs(tmp_dir, exist_ok=True)
conn = sqlite3.connect(db_file)
c = conn.cursor()
# Ensure qbits table
c.execute('''CREATE TABLE IF NOT EXISTS qbits (
    id INTEGER PRIMARY KEY,
    agent TEXT,
    prompt TEXT,
    hash TEXT,
    response TEXT,
    timestamp REAL
)''')
# Neuro reasoning: simple deterministic transformation
response = f"[PY][Neuro] Analyzed prompt: {prompt} | hash: {hashval[:8]}"
c.execute("INSERT INTO qbits (agent,prompt,hash,response,timestamp) VALUES (?,?,?,?,?)",
          ("neuro", prompt, hashval, response, time.time()))
conn.commit()
# Write JSON output
json_file = os.path.join(tmp_dir, f"{hashval}.json")
with open(json_file, 'w') as f:
    json.dump({"agent":"neuro","prompt":prompt,"response":response,"hash":hashval}, f)
print(response)
conn.close()
EOF
chmod +x "$PY_FILE"

# Create minimal ai.js for Node parallel reasoning
JS_FILE="$AI/ai.js"
cat <<'EOF' > "$JS_FILE"
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const prompt = process.argv[2];
const hashval = process.argv[3];
const db_file = process.argv[4]; // placeholder, not used in Node for now
const tmp_dir = process.argv[5];

fs.mkdirSync(tmp_dir, {recursive:true});
const response = `[JS][Crew-AI] Processed prompt: ${prompt} | hash: ${hashval.slice(0,8)}`;
const out = {agent:"crew-ai", prompt, response, hash:hashval};
fs.writeFileSync(path.join(tmp_dir, `${hashval}.json`), JSON.stringify(out));
console.log(response);
EOF
chmod +x "$JS_FILE"

# Create CLI runner
CLI="$AI/ai_host.sh"
cat <<'EOF' > "$CLI"
#!/bin/bash
# AI CLI runner with Neuro + Crew-AI
BASE="$HOME/_"
AI="$BASE/ai"
DB="$BASE/db"
TMP="$AI/tmp"

read -p "Enter human prompt: " PROMPT
if [[ -z "$PROMPT" ]]; then
    echo "[Cockpit] ⚠ Prompt empty!"
    exit 1
fi

HASH=$(echo -n "$PROMPT$(date +%s%N)" | sha256sum | awk '{print $1}')
echo "[NEXUS] ⚙️ Generated entropy hash: $HASH"

# Run Python Neuro
python3 "$AI/ai.py" "$PROMPT" "$HASH" "$DB/qbits.db" "$TMP" &
PY_PID=$!

# Run Node Crew-AI
node "$AI/ai.js" "$PROMPT" "$HASH" "$DB/qbits.db" "$TMP" &
JS_PID=$!

wait $PY_PID
wait $JS_PID

echo "[NEXUS] ✅ Crew + Neuro completed. JSON outputs in $TMP"
EOF
chmod +x "$CLI"

echo "[Installer] Full AI bundle installed successfully!"
echo "Use the cockpit via:"
echo "  source $ENV_FILE"
echo "  $CLI"
