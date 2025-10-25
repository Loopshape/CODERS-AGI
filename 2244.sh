#!/usr/bin/env bash
# nemodian_agent_v54.sh — Rebuilt Nemodian Agent v54 with full orchestration

set -euo pipefail
IFS=$'\n\t'

# ---------------- CONFIG ----------------
AGENTS=("loop" "code" "coin" "2244" "core")
ORCH_NAME="NEMODIAN_V54"
MAX_DEPTH="${1:-4}"

PROJECTS_DIR="${PROJECTS_DIR:-$HOME/ai_projects}"
timestamp=$(date +%s)
short_hash=$(echo "$RANDOM$timestamp" | sha256sum | cut -c1-8)
project="${project:-nemodian-${timestamp}-${short_hash}}"
neuro="${neuro:-$project}"
task="${task:-$project}"

mkdir -p "$PROJECTS_DIR/$project"

declare -A HASH_STORE
declare -A QBIT_STORE
declare -A SUBCONSCIOUS_QUEUE
JSON_MINDSET='{"fused_nodes":[]}'

for agent in "${AGENTS[@]}"; do SUBCONSCIOUS_QUEUE["$agent"]=""; done

# ---------------- UTILITIES ----------------
log() { echo "[${ORCH_NAME}] $(date '+%Y-%m-%d %H:%M:%S') - $*"; }
timestamp_nano() { date +%s%N; }
hash_string() { echo -n "$1" | sha256sum | cut -d' ' -f1; }
rehash_string() { echo -n "$1$RANDOM$(timestamp_nano)" | sha256sum | cut -c1-8; }

# ---------------- HUMAN-READABLE TOKEN EXPLANATION ----------------
explain_token() {
    local agent="$1"
    local token="$2"
    local hash="$3"
    local rehash="$4"

    cat <<EOF
>>> Agent: $agent
Token: $token
Hash: $hash
Rehash: $rehash
Meaning:
  - '$token' analyzed by $agent
  - Hash encodes timestamp + randomness
  - Rehash simulates predictive learning
  - This is $agent's interpretation in context
-----------------------------------------------------------
EOF
}

# ---------------- QBIT & SUBCONSCIOUS ----------------
push_qbit() {
    local agent="$1"
    local token="$2"
    local response="$3"

    local hash rehash strain layer corner sector explanation
    hash=$(hash_string "$token")
    rehash=$(rehash_string "$hash")
    HASH_STORE["$hash"]="$rehash"

    strain=$((0x${hash:0:2}%4))
    layer=$((0x${hash:2:2}%2))
    corner=$((0x${hash:4:2}%4))
    sector=$((0x${hash:6:2}%4))

    explanation="Token '$token' analyzed by $agent. Hash encodes timestamp+randomness. Rehash simulates learning."

    QBIT_STORE["$hash"]="agent:$agent token:$token rehash:$rehash strain:$strain layer:$layer corner:$corner sector:$sector ts:$(timestamp_nano)"

    JSON_MINDSET=$(jq --arg agent "$agent" \
                       --arg token "$token" \
                       --arg hash "$hash" \
                       --arg rehash "$rehash" \
                       --arg explanation "$explanation" \
                       --arg response "$response" \
                       --argjson strain "$strain" \
                       --argjson layer "$layer" \
                       --argjson corner "$corner" \
                       --argjson sector "$sector" \
        '.fused_nodes += [{
            "agent": $agent,
            "token": $token,
            "hash": $hash,
            "rehash": $rehash,
            "strain": $strain,
            "layer": $layer,
            "corner": $corner,
            "sector": $sector,
            "timestamp": "'$(timestamp_nano)'",
            "explanation": $explanation,
            "ai_response": $response
        }]' <<<"$JSON_MINDSET")

    log "[$agent] Qbit pushed: $hash → $rehash"
    explain_token "$agent" "$token" "$hash" "$rehash"
    [[ -n "$response" ]] && echo "AI Response: $response"
}

push_subconscious() {
    local agent="$1"
    local token="$2"
    SUBCONSCIOUS_QUEUE["$agent"]+="${token}|$(timestamp_nano);"
    log "[$agent] token queued in subconscious"
}

replay_subconscious() {
    for agent in "${AGENTS[@]}"; do
        IFS=';' read -ra items <<<"${SUBCONSCIOUS_QUEUE[$agent]:-}"
        for item in "${items[@]}"; do
            [[ -z "$item" ]] && continue
            local token="${item%%|*}"
            dispatch_task "$agent" "$token"
        done
        SUBCONSCIOUS_QUEUE["$agent"]=""
        log "[$agent] subconscious queue replayed"
    done
}

# ---------------- TASK DISPATCH ----------------
dispatch_task() {
    local agent="$1"
    local token="$2"
    local response=""

    if (( RANDOM % 2 )); then
        if command -v ollama >/dev/null 2>&1; then
            response=$(ollama run 2244-1 --prompt "$token" 2>/dev/null || "")
            log "[$agent] Ollama response received"
        fi
    else
        log "[$agent] sending token to Deepseek cloud..."
        response=$(curl -s -X POST https://api.deepseek.ai/process \
            -H "Content-Type: application/json" \
            -d "{\"prompt\":\"$token\"}" || "")
        log "[$agent] Cloud response received"
    fi

    push_qbit "$agent" "$token" "$response"
}

# ---------------- RECURSIVE ORCHESTRATION ----------------
orchestrate_cli() {
    local depth="$1"
    local parent_hash="${2:-ROOT}"

    # enforce numeric depth
    if ! [[ "$depth" =~ ^[0-9]+$ ]]; then
        log "WARNING: depth is not numeric: $depth — skipping recursion"
        return
    fi

    local current_hash current_rehash
    current_hash=$(hash_string "${parent_hash}_depth_${depth}")
    current_rehash=$(rehash_string "$current_hash")
    HASH_STORE["$current_hash"]="$current_rehash"

    log "Depth $depth | Hash: $current_hash | Rehash: $current_rehash"

    for agent in "${AGENTS[@]}"; do
        local token="${agent}_${current_hash}"
        dispatch_task "$agent" "$token" &
    done
    wait

    if (( depth > 1 )); then
        orchestrate_cli $((depth - 1)) "$current_rehash"
    fi

    replay_subconscious
}

# ---------------- MAIN ----------------
log "Starting Nemodian Agent v54 Orchestrator..."
orchestrate_cli "$MAX_DEPTH"
log "Orchestration complete."

mindset_file="$PROJECTS_DIR/$project/mindset.json"
echo "$JSON_MINDSET" | jq . > "$mindset_file"
log "Mindset JSON saved: $mindset_file"

exit 0
