#!/bin/bash
# 2244 AI advanced hyper-reasoning bundle
set -e

BASE_DIR="$HOME/_"
AI_DIR="$BASE_DIR/ai"
MEM_DIR="$AI_DIR/memory"
JSON_DIR="$AI_DIR/json"
mkdir -p "$AI_DIR" "$MEM_DIR" "$JSON_DIR"

AGENTS=("core" "loop" "code" "coin" "2244" "neuro")
MODEL_MAP=("core:latest" "loop:latest" "code:latest" "coin:latest" "2244:latest" "gemma3:1b")
CREW_POOL="deepseek-coder:latest"
SQLITE_MEMORY="$MEM_DIR/memory.db"
MAX_CYCLES=3

# --- Prompt ---
[ -z "$1" ] && read -p "Enter human prompt: " HUMAN_PROMPT || HUMAN_PROMPT="$1"

echo "[Cockpit] 🚀 Starting AI Crew Hyper-Reasoning..."

# --- Python: Qbit / SQLite / Neuro --- #
PYTHON_QBIT=$(cat <<'PYTHON'
import sys, sqlite3, hashlib, json, time

MEM_DB = sys.argv[1]
PROMPT = sys.argv[2]
AGENTS = json.loads(sys.argv[3])
MODEL_MAP = json.loads(sys.argv[4])
CREW_POOL = sys.argv[5]
CYCLE = int(sys.argv[6])

conn = sqlite3.connect(MEM_DB)
c = conn.cursor()
c.execute("CREATE TABLE IF NOT EXISTS qbits(agent TEXT, qid TEXT, value TEXT, cycle INT)")
conn.commit()

def hash_prompt(prompt):
    return hashlib.sha256(prompt.encode()).hexdigest()[:64]

mutated_prompt = hash_prompt(PROMPT)
print(f"[Neuro] Cycle {CYCLE} mutated prompt: {mutated_prompt}")

# --- Run agents in "parallel" (simulated here) ---
responses = {}
for idx, agent in enumerate(AGENTS):
    model = MODEL_MAP[idx]
    response_text = f"{agent}({model}) received: {mutated_prompt}"
    qid = hashlib.md5(f"{agent}{CYCLE}".encode()).hexdigest()
    c.execute("INSERT INTO qbits(agent,qid,value,cycle) VALUES (?,?,?,?)",
              (agent, qid, response_text, CYCLE))
    responses[agent] = response_text
    print(f"[{agent}] {response_text}")

# Crew-AI pool
crew_response = f"Crew-AI({CREW_POOL}) received: {mutated_prompt}"
qid = hashlib.md5(f"Crew-AI{CYCLE}".encode()).hexdigest()
c.execute("INSERT INTO qbits(agent,qid,value,cycle) VALUES (?,?,?,?)",
          ("Crew-AI", qid, crew_response, CYCLE))
responses["Crew-AI"] = crew_response
print(f"[Crew-AI] {crew_response}")

conn.commit()
conn.close()

# --- Export JSON mesh ---
mesh_file = f"{sys.argv[7]}/mesh_cycle_{CYCLE}.json"
with open(mesh_file, "w") as f:
    json.dump({"cycle": CYCLE, "prompt": PROMPT, "responses": responses}, f)
print(f"[Export] JSON mesh written: {mesh_file}")
PYTHON
)

# --- Main Loop ---
cycle=1
while [ $cycle -le $MAX_CYCLES ]; do
    python3 -c "$PYTHON_QBIT" \
        "$SQLITE_MEMORY" \
        "$HUMAN_PROMPT" \
        "$(printf '%s\n' "${AGENTS[@]}" | jq -R . | jq -s .)" \
        "$(printf '%s\n' "${MODEL_MAP[@]}" | jq -R . | jq -s .)" \
        "$CREW_POOL" \
        "$cycle" \
        "$JSON_DIR"
    ((cycle++))
done

echo "[Cockpit] 🔹 Neuro + JSON Mesh pipeline finished."
