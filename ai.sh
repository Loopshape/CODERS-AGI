#!/usr/bin/env bash
# ~/_/ai.sh - 2244 Crew Parallel AI Orchestrator
# Requirements: Ollama 0.12.x running locally, models pulled

# --- CONFIG ---
AGENTS=(core loop code coin 2244 neuro)
MODEL_MAP=(
    [core]="core:latest"
    [loop]="loop:latest"
    [code]="code:latest"
    [coin]="coin:latest"
    [2244]="2244:latest"
    [neuro]="gemma3:1b"
)
CREW_POOL="deepseek-coder:latest"
LOG_FILE="$HOME/_/ai/crew.log"

# --- FUNCTIONS ---

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Send prompt to an agent, stream JSON response
stream_agent() {
    local agent="$1"
    local prompt="$2"
    local model="${MODEL_MAP[$agent]}"
    log "🚀 $agent START stream"

    curl -s -N -X POST http://localhost:11434/api/generate \
        -H 'Content-Type: application/json' \
        -d "{\"model\":\"$model\",\"prompt\":\"$prompt\",\"stream\":true}" \
        | while IFS= read -r line; do
            [[ -z "$line" ]] && continue
            if echo "$line" | grep -q '"response"'; then
                local resp=$(echo "$line" | jq -r '.response')
                echo "[$agent] $resp"
            fi
        done

    log "✅ $agent END stream"
}

# Neuro observer: reads all outputs and provides strategic advice
neuro_observe() {
    local prompt="$1"
    log "👁️ Neuro observing..."
    stream_agent "neuro" "$prompt"
}

# Crew pool summarizer
crew_pool() {
    local prompt="$1"
    log "🤖 Crew Pool processing..."
    stream_agent "Crew-AI" "$prompt"
}

# Parallel execution
run_parallel() {
    local prompt="$1"
    neuro_observe "$prompt" &  # Neuro watches while agents process
    PIDS=()
    for agent in "${AGENTS[@]}"; do
        [[ "$agent" == "neuro" ]] && continue  # Neuro already running
        stream_agent "$agent" "$prompt" &
        PIDS+=($!)
    done
    crew_pool "$prompt" &
    PIDS+=($!)
    wait "${PIDS[@]}"
}

# --- MAIN ---
if [[ $# -eq 0 ]]; then
    echo "Usage: ai.sh 'Your prompt here...'"
    exit 1
fi

PROMPT="$*"
log "=== NEW PROMPT ==="
log "Prompt: $PROMPT"
run_parallel "$PROMPT"
log "=== PROMPT COMPLETE ==="
