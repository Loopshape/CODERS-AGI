#!/usr/bin/env bash
# ai.sh v35 - Termux Ollama Orchestrator (Full Unrestricted File I/O, Self-Healing, Webkit Tool)
set -euo pipefail
IFS=$'\n\t'

# --- CONFIG ---
AI_HOME="${AI_HOME:-$HOME/.ai_agent}"
PROJECTS_DIR="${PROJECTS_DIR:-$HOME/ai_projects}"
LOG_FILE="$AI_HOME/ai.log"
LOG_LEVEL="${LOG_LEVEL:-DEBUG}"
CORE_DB="$AI_HOME/agent_core.db"

MESSENGER_MODEL="loop:latest"
PLANNER_MODELS=("loop:latest" "core:latest")
EXECUTOR_MODEL="2244:latest"
OLLAMA_BIN="$(command -v ollama || echo 'ollama')"

MAX_AGENT_LOOPS=7
SWAP_DIR="$AI_HOME/swap"
HMAC_SECRET_KEY="$AI_HOME/secret.key"
UNRESTRICTED_ACCESS=true       # Beta: allow any file path

# --- LOGGING ---
log_to_file(){ echo "[$(date '+%F %T')] [$1] $2" >> "$LOG_FILE"; }
log_info(){ [[ "$LOG_LEVEL" =~ ^(DEBUG|INFO)$ ]] && echo -e "[INFO] $*" >&2 && log_to_file "INFO" "$*"; }
log_warn(){ echo -e "[WARN] $*" >&2 && log_to_file "WARN" "$*"; }
log_error(){ echo -e "[ERROR] $*" >&2 && log_to_file "ERROR" "$*"; }
log_success(){ echo -e "[OK] $*" >&2 && log_to_file "SUCCESS" "$*"; }
log_debug(){ [[ "$LOG_LEVEL" == "DEBUG" ]] && echo -e "[DEBUG] $*" >&2 && log_to_file "DEBUG" "$*"; }

# --- ENV INIT ---
init_environment(){
    mkdir -p "$AI_HOME" "$PROJECTS_DIR" "$SWAP_DIR"
    [[ -f "$HMAC_SECRET_KEY" ]] || openssl rand -hex 32 > "$HMAC_SECRET_KEY"
    chmod 600 "$HMAC_SECRET_KEY"
}

hash_string(){ echo -n "$1" | sha256sum | awk '{print $1}'; }
calculate_hmac(){ local data="$1"; local key; key=$(<"$HMAC_SECRET_KEY"); echo -n "$data" | openssl dgst -sha256 -hmac "$key" | awk '{print $2}'; }

# --- AI WORKER (FIXED FOR V12.X) ---
run_worker_fast(){
    local model="$1"; shift
    local input="$*"
    local output=""

    if [[ "$model" == "2244:latest" ]] && (( ${#input} > 10 )); then
        log_warn "Input too long for $model; truncating to 10 chars."
        input="${input:0:10}"
    fi
    
    log_debug "Running $model (len=${#input}): $input"
    
    # FIX: Pipe the prompt content to 'ollama run' standard input
    # Capture output and check status for self-healing logic
    if ! output=$(echo "$input" | "$OLLAMA_BIN" run "$model" 2>&1); then
        OLLAMA_STATUS=$?
        log_error "Ollama worker failed (Model: $model, Status: $OLLAMA_STATUS). Output:\n$output"
        # Return an error message the AGI can process
        echo "[OLLAMA_FAILURE] Model $model failed to execute. Status $OLLAMA_STATUS."
        return 1
    fi

    echo "$output"
}

# --- TOOL DEFINITION: Webkit/Curl Fetch ---
# Uses curl (standard in Termux) for batch web content retrieval.
web_fetch(){
    local url="$1"
    local output_file="$SWAP_DIR/$(hash_string "$url").html"
    local MAX_CONTENT_SIZE=10240 # Limit to 10KB to protect model context
    
    if [[ ! "$url" =~ ^https?:// ]]; then
        log_error "Invalid URL format: $url"
        echo "ERROR: Invalid URL format. Must start with http:// or https://."
        return 1
    fi

    log_info "Attempting to fetch content from: $url"

    if command -v curl >/dev/null 2>&1; then
        # -s: Silent, -L: Follow redirects, --max-time: Timeout
        if curl -s -L --max-time 15 "$url" -o "$output_file"; then
            if [[ -s "$output_file" ]]; then
                log_success "Successfully fetched content to $output_file"
                # Output truncated content for the AI to consume
                head -c $MAX_CONTENT_SIZE "$output_file"
            else
                log_warn "Web fetch succeeded but file is empty."
                echo "ERROR: Fetched content was empty or unreadable."
                return 1
            fi
        else
            log_error "Curl failed to fetch URL: $url"
            echo "ERROR: Failed to fetch URL or operation timed out after 15s."
            return 1
        fi
    else
        log_error "Curl command not found. Cannot perform web_fetch."
        echo "ERROR: 'curl' tool dependency missing. Cannot perform web fetch."
        return 1
    fi
}


# --- FILE ACCESS TOOLS ---
file_write(){
    local path="$1"; shift
    local content="$*"
    if [[ "$UNRESTRICTED_ACCESS" != true ]]; then
        log_warn "Restricted mode: file_write limited to $PROJECTS_DIR"
        path="$PROJECTS_DIR/$path"
    fi
    echo "$content" > "$path"
    local hmac=$(calculate_hmac "$content")
    log_info "Wrote file $path (HMAC $hmac)"
    echo "$hmac"
}

file_read(){
    local path="$1"
    if [[ "$UNRESTRICTED_ACCESS" != true ]]; then
        log_warn "Restricted mode: file_read limited to $PROJECTS_DIR"
        path="$PROJECTS_DIR/$path"
    fi
    if [[ ! -f "$path" ]]; then
        log_warn "File not found: $path"; return 1
    fi
    local content; content=$(<"$path")
    local hmac=$(calculate_hmac "$content")
    log_info "Read file $path (HMAC $hmac)"
    echo "$content"
}

# --- CACHE / STORAGE ---
store_output_fast(){
    local content="$*"
    local ref=$(hash_string "$content")
    file_write "$PROJECTS_DIR/$ref.txt" "$content" >/dev/null
    echo "$ref"
}

get_cached_response(){ 
    local prompt="$*"; local ref; ref=$(hash_string "$prompt")
    [[ -f "$PROJECTS_DIR/$ref.txt" ]] && <"$PROJECTS_DIR/$ref.txt" || echo "" 
}

# --- AGI LOOP ---
run_agi_workflow(){
    local user_prompt="$*"
    local task_id=$(hash_string "$user_prompt$(date +%s%N)" | cut -c1-16)
    local project_dir="$PROJECTS_DIR/task-$task_id"
    mkdir -p "$project_dir"
    log_success "Project workspace: $project_dir (Task ID: $task_id)"

    local cached_ref=$(get_cached_response "$user_prompt")
    if [[ -n "$cached_ref" ]]; then
        log_success "Returning cached response."
        echo "$cached_ref"
        return
    fi

    local available_tools="Available tools:\n- web_fetch(url): Fetches web content for analysis (up to 10KB). Call format: [TOOL_CALL:web_fetch:https://example.com]\n"
    local initial_prompt_for_ai="Initial Request: $user_prompt\n\n$available_tools\n\nBegin Planning:"
    local conversation_history="$initial_prompt_for_ai"
    local status="IN_PROGRESS"

    for ((i=1;i<=MAX_AGENT_LOOPS;i++)); do
        log_info "AGI Loop $i/$MAX_AGENT_LOOPS"

        # Messenger: Analyze request and previous context
        local messenger_input="You are Messenger. Analyze the latest state:\n$conversation_history"
        local messenger_output=$(run_worker_fast "$MESSENGER_MODEL" "$messenger_input")
        log_debug "Messenger output: $messenger_output"

        # Planners: Create plans based on Messenger's analysis
        local planner_outputs=()
        for model in "${PLANNER_MODELS[@]}"; do
            local planner_output=$(run_worker_fast "$model" "Planner input: $messenger_output")
            planner_outputs+=("$planner_output")
            log_debug "Planner ($model): $planner_output"
        done

        # Executor: Synthesize plans and decide on tool calls
        local executor_input="You are Executor. Your output must contain a final answer tag or a tool call. Merge and execute plans:\n${planner_outputs[*]}"
        local final_plan=$(run_worker_fast "$EXECUTOR_MODEL" "$executor_input")
        log_debug "Executor output: $final_plan"

        # Write loop summary
        file_write "$project_dir/loop-$i.txt" "$final_plan" >/dev/null
        
        # --- Tool Execution and Self-Healing Feedback ---
        local tool_results=""
        # Regex to find tool calls: [TOOL_CALL:tool_name:arg]
        while IFS= read -r line; do
            if [[ "$line" =~ ^.*\[TOOL_CALL:([^:]+):([^]]+)\] ]]; then
                local tool_name="${BASH_REMATCH[1]}"
                local tool_arg="${BASH_REMATCH[2]}"
                
                log_info "Detected Tool Call: $tool_name with argument '$tool_arg'"
                
                local result_output
                case "$tool_name" in
                    web_fetch)
                        # Execute tool and capture all output (including errors)
                        result_output=$(web_fetch "$tool_arg" 2>&1) 
                        ;;
                    *)
                        result_output="ERROR: Unknown tool '$tool_name'. Check syntax."
                        ;;
                esac
                
                # Append tool result to be fed back to the agents (self-healing)
                tool_results+="\n[TOOL_RESULT:$tool_name:$tool_arg]\n$result_output\n[/TOOL_RESULT]"
            fi
        done <<< "$final_plan"

        # Update conversation history with plan and tool feedback
        conversation_history="$conversation_history\n--- Loop $i ---\n$final_plan"
        if [[ -n "$tool_results" ]]; then
            log_info "Tools executed. Appending feedback for self-healing."
            conversation_history+="\n--- TOOL FEEDBACK ---\n$tool_results"
        fi

        # Check for final answer only after processing feedback
        if [[ "$final_plan" == *"[FINAL_ANSWER]"* ]]; then
            status="SUCCESS"
            break
        fi
        
        # Prevent infinite loops due to planning/tool failure by checking MAX_AGENT_LOOPS limit.
        if (( i == MAX_AGENT_LOOPS )) && [[ "$status" != "SUCCESS" ]]; then
            log_error "Reached max loops ($MAX_AGENT_LOOPS) without [FINAL_ANSWER]."
            conversation_history+="\n[FINAL_ANSWER] ERROR: Max agent loops reached without a conclusive answer. Plan execution failed."
            status="FAILED"
            break
        fi
    done

    # Store final output
    local final_ref=$(store_output_fast "$conversation_history")
    log_success "AGI workflow complete (Status: $status), saved to $PROJECTS_DIR/$final_ref.txt"
    echo -e "\n--- Final Answer (Status: $status) ---\n$conversation_history"
}

# --- ENTRY POINT ---
main(){
    init_environment
    local cmd="${1:-}"; shift || true
    case "$cmd" in
        --setup|-s) log_info "Setup mode: Termux deps handled externally." ;;
        --help|-h) echo "Usage: $0 \"<prompt>\""; exit 0 ;;
        serve) log_info "Serve mode not implemented for Termux v12"; exit 0 ;;
        "") log_info "No prompt given. Run with a task: $0 \"Write a new function.\"" ; exit 0 ;;
        *) run_agi_workflow "$cmd" "$@" ;;
    esac
}

main "$@"
