#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────
#  NEXUS: CORE MILESTONE α INSTALLER + GLOBAL COMMAND REGISTRATION
# ────────────────────────────────────────────────────────────────

set -e
BASE_DIR="$HOME/_/ai"
BIN_DIR="$BASE_DIR/bin"
CREW_DIR="$BASE_DIR/crew"
DB_DIR="$BASE_DIR/db"
DOC_FILE="$BASE_DIR/CORE_MILESTONE_ALPHA.md"

echo "[NEXUS] 🌀 Installing Core Milestone α ..."
mkdir -p "$BIN_DIR" "$CREW_DIR" "$DB_DIR" "$BASE_DIR"/{logs,tmp}

# Dependencies
command -v python3 >/dev/null || { echo "Python3 missing"; exit 1; }
command -v node >/dev/null || { echo "Node.js missing"; exit 1; }

# venv
if [ ! -d "$HOME/.env.local" ]; then
  echo "[NEXUS] Creating .env.local ..."
  python3 -m venv "$HOME/.env.local"
fi

# Doctrine
cat > "$DOC_FILE" <<'EOF'
# CORE MILESTONE α  
### Entropic Psychologics for AI File Processing  
**Codename:** NEXUS (LCP Core Doctrine)
EOF

# Crew setup
for AGENT in core loop code coin 2244 neuro; do
  mkdir -p "$CREW_DIR/$AGENT"
  echo "#!/usr/bin/env bash" > "$CREW_DIR/$AGENT/run.sh"
  echo "echo \"[$AGENT] operational\"" >> "$CREW_DIR/$AGENT/run.sh"
  chmod +x "$CREW_DIR/$AGENT/run.sh"
done

# Main AI Launcher
cat > "$BASE_DIR/ai.sh" <<'EOF'
#!/usr/bin/env bash
# NEXUS AI Master Vector — Core α
BASE_DIR="$HOME/_/ai"
source "$HOME/.env.local/bin/activate" 2>/dev/null || true

PROMPT="$*"
if [ -z "$PROMPT" ]; then
  read -rp "Enter human prompt: " PROMPT
fi

HASH=$(echo -n "$PROMPT$(date +%s)" | sha256sum | awk '{print $1}')
echo "[NEXUS] ⚙️  AI Vector initiated."
echo "[NEXUS] Generated entropy hash: $HASH"

python3 "$BASE_DIR/bin/ai_py.py" "$PROMPT" "$HASH"
node "$BASE_DIR/bin/ai_js.js" "$PROMPT" "$HASH"
EOF
chmod +x "$BASE_DIR/ai.sh"

# Python Qbit Logic
cat > "$BIN_DIR/ai_py.py" <<'EOF'
import sys, hashlib, sqlite3, json, time, os
prompt = sys.argv[1]
hashv = sys.argv[2]
db_path = os.path.expanduser("~/_.ai/db/qbits.db")
os.makedirs(os.path.dirname(db_path), exist_ok=True)
conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("CREATE TABLE IF NOT EXISTS qbits (hash TEXT, prompt TEXT, ts REAL)")
c.execute("INSERT INTO qbits VALUES (?,?,?)", (hashv, prompt, time.time()))
conn.commit()
print(f"[PY] Qbit stored -> {hashv[:8]}")
conn.close()
EOF

# JS Resonance Logic
cat > "$BIN_DIR/ai_js.js" <<'EOF'
const fs = require("fs");
const path = require("path");
const prompt = process.argv[2];
const hashv = process.argv[3];
const outfile = path.join(process.env.HOME, "_/ai/tmp", `${hashv}.json`);
const data = { prompt, hash: hashv, ts: Date.now() };
fs.writeFileSync(outfile, JSON.stringify(data, null, 2));
console.log(`[JS] Resonance stored: ${outfile}`);
EOF
chmod +x "$BIN_DIR"/*.{py,js}

# Global Symlink
if [ -d "/data/data/com.termux/files/usr/bin" ]; then
  LINK_PATH="/data/data/com.termux/files/usr/bin/ai"
else
  LINK_PATH="/usr/local/bin/ai"
fi

ln -sf "$BASE_DIR/ai.sh" "$LINK_PATH"
chmod +x "$LINK_PATH"

echo "[NEXUS] ✅ Installation complete."
echo "[NEXUS] Command registered globally as: ai"
echo "Try: ai 'crew ready check'"
