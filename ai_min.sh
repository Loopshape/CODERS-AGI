#!/usr/bin/env bash
# ai_min.sh — Minimal AGI wrapper for Termux Ollama v12.x

set -euo pipefail
IFS=$'\n\t'

AI_HOME="${AI_HOME:-$HOME/.ai_agent}"
PROJECTS_DIR="${PROJECTS_DIR:-$HOME/ai_projects}"
OLLAMA_BIN="$(command -v ollama || echo 'ollama')"
EXECUTOR_MODEL="2244:latest"
UNRESTRICTED_ACCESS=true
MAX_AGENT_LOOPS=5

mkdir -p "$AI_HOME" "$PROJECTS_DIR"

hash_string(){ echo -n "$1" | sha256sum | awk '{print $1}'; }

# Minimal worker (pipes input directly to Ollama)
run_worker_fast(){
    local model="$1"; shift
    local input="$*"
    if [[ "$model" == "2244:latest" ]] && (( ${#input} > 10 )); then
        input="${input:0:10}"  # v12.x workaround
    fi
    echo "$input" | "$OLLAMA_BIN" run "$model"
}

# Minimal AGI workflow
run_agi_min(){
    local user_prompt="$*"
    local conversation="$user_prompt"
    local status="IN_PROGRESS"

    for ((i=1;i<=MAX_AGENT_LOOPS;i++)); do
        local output=$(run_worker_fast "$EXECUTOR_MODEL" "$conversation")

        # Check for final answer tag
        if [[ "$output" == *"[FINAL_ANSWER]"* ]]; then
            status="SUCCESS"
            echo "$output"
            return
        fi

        # Feed back output for next loop
        conversation="$conversation"$'\n'"$output"
    done

    echo "[FINAL_ANSWER] ERROR: Max loops reached without conclusive answer."
}

# Entry
if [[ $# -lt 1 ]]; then
    echo "Usage: $0 \"<prompt>\""
    exit 1
fi

run_agi_min "$*"
