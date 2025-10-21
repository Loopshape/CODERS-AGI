#!/bin/bash
# Offline installer for 2244 AI bundle (~/_/ai)

set -e

BASE_DIR="$HOME/_"
AI_DIR="$BASE_DIR/ai"
MEM_DIR="$AI_DIR/memory"
JSON_DIR="$AI_DIR/json"
WHEEL_DIR="$AI_DIR/wheels"

echo "[Installer] Creating directories..."
mkdir -p "$AI_DIR" "$MEM_DIR" "$JSON_DIR" "$WHEEL_DIR"

# === 1. Copy or place pre-downloaded wheels into $WHEEL_DIR ===
# Expected: aiohttp-*.whl, yarl-*.whl, multidict-*.whl
# Example offline command:
# cp /path/to/wheels/*.whl $WHEEL_DIR/

# === 2. Install Python dependencies offline ===
echo "[Installer] Installing Python dependencies offline..."
pip install --no-index --find-links="$WHEEL_DIR" aiohttp || echo "[Installer] aiohttp wheel installation failed."

# === 3. Write ai.sh (driver) ===
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

# === 4. Python scripts ===
# Reuse the previous `ai_agent.py`, `ai_mutate.py`, `ai_neuro.py`, `ai_export_json.py` content
# Save them in $AI_DIR and chmod +x

echo "[Installer] ✅ Offline AI bundle ready at $AI_DIR"
echo "[Installer] Run: $AI_DIR/ai.sh"
