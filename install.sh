#!/bin/bash
# Installer for 2244 AI bundle (~/_/ai)

set -e

BASE_DIR="$HOME/_"
AI_DIR="$BASE_DIR/ai"
MEM_DIR="$AI_DIR/memory"
JSON_DIR="$AI_DIR/json"

echo "[Installer] Creating directories..."
mkdir -p "$AI_DIR" "$MEM_DIR" "$JSON_DIR"

# Write ai.sh
cat > "$AI_DIR/ai.sh" << 'EOF'
#!/bin/bash
BASE_DIR="$HOME/_"
AI_DIR="$BASE_DIR/ai"
MEM_DIR="$AI_DIR/memory"
JSON_DIR="$AI_DIR/json"
mkdir -p "$MEM_DIR" "$JSON_DIR"

AGENTS=("core" "loop" "code" "coin" "2244" "neuro")
MODEL_MAP=("core:latest" "loop:latest" "code:latest" "coin:latest" "2244:latest" "gemma3:1b")
CREW_POOL="deepseek-coder:latest"
SQLITE_MEMORY="$MEM_DIR/memory.db"
MAX_CYCLES=3

[ -z "$1" ] && read -p "Enter human prompt: " human_prompt || human_prompt="$1"

cycle=1
while [ $cycle -le $MAX_CYCLES ]; do
    echo "[Cockpit] ⚡ Cycle $cycle / $MAX_CYCLES"
    mutated_prompt=$(python3 "$AI_DIR/ai_mutate.py" "$human_prompt")
    echo "[Cockpit] 🌀 Mutated prompt: $mutated_prompt"
    for idx in "${!AGENTS[@]}"; do
        agent="${AGENTS[$idx]}"
        model="${MODEL_MAP[$idx]}"
        python3 "$AI_DIR/ai_agent.py" "$agent" "$model" "$mutated_prompt" &
    done
    python3 "$AI_DIR/ai_agent.py" "Crew-AI" "$CREW_POOL" "$mutated_prompt" &
    wait
    python3 "$AI_DIR/ai_neuro.py"
    python3 "$AI_DIR/ai_export_json.py" "$JSON_DIR/mesh_cycle_$cycle.json"
    echo "[Cockpit] ✅ Cycle $cycle completed."
    ((cycle++))
done
echo "[Cockpit] 🔹 Neuro + JSON Mesh pipeline finished."
EOF

chmod +x "$AI_DIR/ai.sh"

# Python dependencies
echo "[Installer] Installing Python3 dependencies..."
python3 -m pip install --upgrade pip
python3 -m pip install aiohttp sqlite3

# ai_agent.py
cat > "$AI_DIR/ai_agent.py" << 'EOF'
#!/usr/bin/env python3
import sys, json, time, sqlite3, aiohttp, asyncio, hashlib

agent, model, prompt = sys.argv[1:4]
db_file = f"{__import__('os').path.expanduser('~/_/ai/memory/memory.db')}"

async def stream_agent():
    ts = time.time()
    qbit_hash = hashlib.sha256(f"{agent}:{prompt}:{ts}".encode()).hexdigest()
    entropy = int(qbit_hash[:8], 16) % 1000
    collected = []
    async with aiohttp.ClientSession() as session:
        async with session.post("http://localhost:11434/api/generate", json={"model": model, "prompt": prompt, "stream": True}) as resp:
            async for line in resp.content:
                chunk = line.decode("utf-8").strip()
                if not chunk: continue
                try:
                    data = json.loads(chunk)
                    if "response" in data:
                        print(f"[{agent}] {data['response']}")
                        collected.append(data["response"])
                except: pass
    conn = sqlite3.connect(db_file)
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS qbits(id TEXT PRIMARY KEY, json TEXT, timestamp REAL, weight REAL);")
    weight = entropy / (1 + time.time() - ts)
    c.execute("INSERT OR REPLACE INTO qbits(id,json,timestamp,weight) VALUES (?,?,?,?)",
              (agent, json.dumps({"prompt": prompt, "qbit": qbit_hash, "responses": collected}), ts, weight))
    conn.commit()
    conn.close()

asyncio.run(stream_agent())
EOF

chmod +x "$AI_DIR/ai_agent.py"

# ai_mutate.py
cat > "$AI_DIR/ai_mutate.py" << 'EOF'
#!/usr/bin/env python3
import sys, sqlite3, json, random

human_prompt = sys.argv[1]
db_file = f"{__import__('os').path.expanduser('~/_/ai/memory/memory.db')}"
conn = sqlite3.connect(db_file)
c = conn.cursor()
c.execute("SELECT json FROM qbits ORDER BY weight DESC LIMIT 5")
top_qbits = c.fetchall()
mutations = []
for q in top_qbits:
    data = json.loads(q[0])
    if "prompt" in data:
        words = data["prompt"].split()
        random.shuffle(words)
        mutations.append(" ".join(words))
if not mutations:
    mutations.append(human_prompt)
print(random.choice(mutations))
conn.close()
EOF

chmod +x "$AI_DIR/ai_mutate.py"

# ai_neuro.py
cat > "$AI_DIR/ai_neuro.py" << 'EOF'
#!/usr/bin/env python3
import sqlite3, json

db_file = f"{__import__('os').path.expanduser('~/_/ai/memory/memory.db')}"
conn = sqlite3.connect(db_file)
c = conn.cursor()
c.execute("SELECT json, weight FROM qbits ORDER BY weight DESC")
all_qbits = c.fetchall()
aggregate = []
for q, w in all_qbits:
    data = json.loads(q)
    if 'responses' in data:
        for r in data['responses']:
            aggregate.append((r, w))
aggregate.sort(key=lambda x: x[1], reverse=True)
print("\n[NEURO] 🔹 Weighted Hyperfast Response:")
for r, w in aggregate:
    print(f"[weight={w:.2f}] {r}")
conn.close()
EOF

chmod +x "$AI_DIR/ai_neuro.py"

# ai_export_json.py
cat > "$AI_DIR/ai_export_json.py" << 'EOF'
#!/usr/bin/env python3
import sqlite3, json, sys

json_file = sys.argv[1]
db_file = f"{__import__('os').path.expanduser('~/_/ai/memory/memory.db')}"
conn = sqlite3.connect(db_file)
c = conn.cursor()
c.execute("SELECT id, json, weight FROM qbits")
mesh = []
for qid, jdata, weight in c.fetchall():
    data = json.loads(jdata)
    data["weight"] = weight
    mesh.append(data)
with open(json_file, "w") as f:
    json.dump(mesh, f, indent=2)
print(f"[Cockpit] 🗂 JSON mesh exported to {json_file}")
conn.close()
EOF

chmod +x "$AI_DIR/ai_export_json.py"

echo "[Installer] ✅ AI bundle installed to $AI_DIR"
echo "[Installer] Run: $AI_DIR/ai.sh"
