#!/usr/bin/env bash
# ai_bundle_installer.sh - Full AI CLI installer

set -e
BASE="$HOME/_"
AI_DIR="$BASE/ai"
ENV_DIR="$BASE/.env.local"

echo "[Installer] Starting AI bundle installation..."

# Create directories
mkdir -p "$AI_DIR/tmp"
mkdir -p "$ENV_DIR"

# Python venv setup
if [ ! -f "$ENV_DIR/bin/activate" ]; then
    echo "[Installer] Creating Python virtual environment..."
    python3 -m venv "$ENV_DIR"
fi

# Activate environment
source "$ENV_DIR/bin/activate"

# Python dependencies
echo "[Installer] Installing Python dependencies..."
pip install --upgrade pip
pip install aiohttp

# Node dependencies
echo "[Installer] Installing Node.js dependencies..."
cd "$AI_DIR"
# Initialize package.json if missing
if [ ! -f package.json ]; then
    npm init -y
fi
# Ensure chalk exists
npm install chalk

# Create ai.py if missing
cat > "$AI_DIR/ai.py" << 'PYTHON'
#!/usr/bin/env python3
import os, sys, json, sqlite3, time, hashlib, asyncio, aiohttp

DB_FILE = os.path.join(os.path.dirname(__file__), 'ai.db')
os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)

# Initialize SQLite
conn = sqlite3.connect(DB_FILE)
c = conn.cursor()
c.execute('''
CREATE TABLE IF NOT EXISTS qbits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT,
    prompt TEXT,
    hash TEXT,
    iteration INTEGER,
    response TEXT,
    timestamp REAL,
    temp REAL
)
''')
conn.commit()

prompt = sys.argv[1] if len(sys.argv) > 1 else input("Enter human prompt: ")

# Generate entropy hash
fractal_hash = hashlib.sha256(prompt.encode()).hexdigest()
print(f"[NEXUS] ⚙️ Generated entropy hash: {fractal_hash}")

# Example iteration
temp_factor = 0.5
recursion_depth = 5

for i in range(1, recursion_depth + 1):
    response = f"{prompt} (iteration {i})"
    c.execute(
        "INSERT INTO qbits (agent,prompt,hash,iteration,response,timestamp,temp) VALUES (?,?,?,?,?,?,?)",
        ("neuro", prompt, fractal_hash, i, response, time.time(), temp_factor)
    )
conn.commit()
print(f"[PY] Qbit stored -> {fractal_hash[:8]}")
PYTHON

chmod +x "$AI_DIR/ai.py"

# Create ai.js if missing
cat > "$AI_DIR/ai.js" << 'JAVASCRIPT'
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function ensurePkg(pkg) {
    try { require.resolve(pkg); } 
    catch { console.log(`[JS] Installing missing package: ${pkg}`); execSync(`npm install ${pkg}`, {stdio:'inherit'}); }
}
ensurePkg('chalk');
const chalk = require('chalk');

const tmpDir = path.resolve(__dirname,'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

function writeStub(agent, data){
    const filename = path.join(tmpDir, `${agent}_${Date.now()}.json`);
    fs.writeFileSync(filename, JSON.stringify(data,null,2));
    console.log(chalk.green(`[JS] Crew-AI stub written to ${filename}`));
}
writeStub('Crew-Pool',{example:"Hello from Node.js AI"});
JAVASCRIPT

chmod +x "$AI_DIR/ai.js"

# Create ai_host.sh
cat > "$AI_DIR/ai_host.sh" << 'BASH'
#!/usr/bin/env bash
source "$HOME/_/.env.local/bin/activate"
PROMPT="$1"
[ -z "$PROMPT" ] && read -p "Enter human prompt: " PROMPT

echo "[Host] Running Python AI..."
python3 "$HOME/_/ai/ai.py" "$PROMPT"

echo "[Host] Running Node AI..."
node "$HOME/_/ai/ai.js"
BASH

chmod +x "$AI_DIR/ai_host.sh"

echo "[Installer] Installation complete."
echo "Activate environment: source $ENV_DIR/bin/activate"
echo "Run cockpit: $AI_DIR/ai_host.sh '<your prompt>'"
