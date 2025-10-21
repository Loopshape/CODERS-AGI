#!/bin/bash
# 2244 AI full offline bundle - single file
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
[ -z "$1" ] && read -p "Enter human prompt: " human_prompt || human_prompt="$1"

# --- Embedded Python scripts ---
ai_mutate=$(cat <<'PYTHON'
import sys, hashlib
prompt = sys.argv[1]
mutated = hashlib.sha256(prompt.encode()).hexdigest()[:64]
print(mutated)
PYTHON
)

ai_agent=$(cat <<'PYTHON'
import sys, json
agent, model, prompt = sys.argv[1:4]
# Example: simulate a response
response = f"{agent}({model}) received: {prompt[:50]}"
print(json.dumps({"response": response}))
PYTHON
)

ai_neuro=$(cat <<'PYTHON'
# Aggregates and prints a weighted summary
print("[Neuro] Aggregating all agent responses for strategy-consulting...")
PYTHON
)

ai_export_json=$(cat <<'PYTHON'
import sys, json
filename = sys.argv[1]
mesh = {"mesh":"example", "filename": filename}
with open(filename,"w") as f:
    json.dump(mesh,f)
print(f"[Export] JSON mesh written: {filename}")
PYTHON
)

# --- Main cycles ---
cycle=1
while [ $cycle -le $MAX_CYCLES ]; do
    echo "[Cockpit] ⚡ Cycle $cycle / $MAX_CYCLES"

    mutated_prompt=$(python3 -c "$ai_mutate" "$human_prompt")
    echo "[Cockpit] 🌀 Mutated prompt: $mutated_prompt"

    for idx in "${!AGENTS[@]}"; do
        agent="${AGENTS[$idx]}"
        model="${MODEL_MAP[$idx]}"
        python3 -c "$ai_agent" "$agent" "$model" "$mutated_prompt" &
    done

    python3 -c "$ai_agent" "Crew-AI" "$CREW_POOL" "$mutated_prompt" &

    wait

    python3 -c "$ai_neuro"
    python3 -c "$ai_export_json" "$JSON_DIR/mesh_cycle_$cycle.json"

    echo "[Cockpit] ✅ Cycle $cycle completed."
    ((cycle++))
done

echo "[Cockpit] 🔹 Neuro + JSON Mesh pipeline finished."
