#!/usr/bin/env bash
# Full AI Bundle Installer (Python3 + Node.js + CLI scripts)

set -e
echo "[Installer] Starting full AI bundle installation..."

BASE_DIR="$HOME/_/ai"
ENV_DIR="$BASE_DIR/.env"
TMP_DIR="$BASE_DIR/tmp"
DB_DIR="$BASE_DIR/db"

# 1️⃣ Create folders
mkdir -p "$BASE_DIR" "$TMP_DIR" "$DB_DIR"

# 2️⃣ Setup Python venv
if [ ! -d "$ENV_DIR" ]; then
    echo "[Installer] Creating Python virtual environment..."
    python3 -m venv "$ENV_DIR"
fi
source "$ENV_DIR/bin/activate"

# 3️⃣ Upgrade pip
python3 -m pip install --upgrade pip

# 4️⃣ Install Python deps
echo "[Installer] Installing Python dependencies..."
python3 -m pip install aiohttp

# 5️⃣ Node.js setup
echo "[Installer] Installing Node.js dependencies..."
cd "$BASE_DIR"
npm init -y >/dev/null 2>&1
npm install chalk >/dev/null 2>&1

# 6️⃣ Write AI Python script
cat > "$BASE_DIR/ai.py" <<'EOF'
#!/usr/bin/env python3
import sqlite3, json, time, hashlib, asyncio, aiohttp, os, sys

DB_PATH = os.path.expanduser("~/_/ai/db/ai_memory.sqlite")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
# create qbits table if missing
c.execute('''CREATE TABLE IF NOT EXISTS qbits
(agent TEXT, prompt TEXT, hash TEXT, iteration INTEGER, response TEXT, timestamp REAL, temp REAL)''')
conn.commit()

prompt = sys.argv[1] if len(sys.argv) > 1 else input("Enter human prompt: ")
temp_factor = 0.5
depth = 5

for i in range(1, depth+1):
    fractal_hash = hashlib.sha256(f"{prompt}{time.time()}{i}".encode()).hexdigest()
    response = f"[Neuro] Iteration {i} response to '{prompt}'"
    c.execute("INSERT INTO qbits (agent,prompt,hash,iteration,response,timestamp,temp) VALUES (?,?,?,?,?,?,?)",
              ("neuro", prompt, fractal_hash, i, response, time.time(), temp_factor))
    conn.commit()
    print(response)
EOF

chmod +x "$BASE_DIR/ai.py"

# 7️⃣ Write AI JS script
cat > "$BASE_DIR/ai.js" <<'EOF'
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const prompt = process.argv[2] || '.';
const tmpDir = path.resolve(__dirname,'tmp');
if(!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

const filename = path.join(tmpDir, Date.now() + '.json');
fs.writeFileSync(filename, JSON.stringify({prompt,promptId:Date.now()}));
console.log(chalk.green("[JS] Crew-AI stub written to " + filename));
EOF

chmod +x "$BASE_DIR/ai.js"

# 8️⃣ Write host CLI
cat > "$BASE_DIR/ai_host.sh" <<'EOF'
#!/usr/bin/env bash
source "$HOME/_/ai/.env/bin/activate"
python3 "$HOME/_/ai/ai.py" "$1"
node "$HOME/_/ai/ai.js" "$1"
EOF

chmod +x "$BASE_DIR/ai_host.sh"

# ✅ Done
echo "[Installer] Full AI bundle installation complete!"
echo "Activate environment: source $BASE_DIR/.env/bin/activate"
echo "Run AI cockpit: $BASE_DIR/ai_host.sh \"Your prompt here\""
