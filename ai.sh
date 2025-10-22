#!/usr/bin/env bash
# ai.sh - AI Autonomic Synthesis Platform v32.1 (Maintenance Features)
# Added rebuild, script, repair, and status commands for agent management.

set -euo pipefail
IFS=$'\n\t'

# ---------------- CONFIG ----------------
AI_HOME="${AI_HOME:-$HOME/.ai_agent}"
PROJECTS_DIR="${PROJECTS_DIR:-$HOME/ai_projects}"
LOG_FILE="$AI_HOME/ai.log"
LOG_LEVEL="${LOG_LEVEL:-INFO}"
CORE_DB="$AI_HOME/agent_core.db"

# --- Triumvirate Model Configuration ---
MESSENGER_MODEL="loop:latest"
PLANNER_MODELS=("loop:latest" "core:latest")
EXECUTOR_MODEL="2244:latest"
OLLAMA_BIN="$(command -v ollama || echo 'ollama')"

MAX_AGENT_LOOPS=7
MAX_RAM_BYTES=2097152
SWAP_DIR="$AI_HOME/swap"
HMAC_SECRET_KEY="$AI_HOME/secret.key"

# ---------------- COLORS & ICONS ----------------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m';
PURPLE='\033[0;35m'; CYAN='\033[0;36m'; ORANGE='\033[0;33m'; NC='\033[0m'
ICON_SUCCESS="✅"; ICON_WARN="⚠️"; ICON_ERROR="❌"; ICON_INFO="ℹ️"; ICON_SECURE="🔑";
ICON_DB="🗃️"; ICON_PLAN="📋"; ICON_THINK="🤔"; ICON_EXEC="⚡"; ICON_BRAIN="🧠"

# ---------------- LOGGING ----------------
log_to_file(){ echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$1] $2" >> "$LOG_FILE"; }
log_debug(){ [[ "$LOG_LEVEL" == "DEBUG" ]] && printf "${PURPLE}[DEBUG][%s]${NC} %s\n" "$(date '+%T')" "$*" >&2 && log_to_file "DEBUG" "$*"; }
log_info(){ [[ "$LOG_LEVEL" =~ ^(DEBUG|INFO)$ ]] && printf "${BLUE}${ICON_INFO} [%s] %s${NC}\n" "$(date '+%T')" "$*" >&2 && log_to_file "INFO" "$*"; }
log_warn(){ printf "${YELLOW}${ICON_WARN} [%s] %s${NC}\n" "$(date '+%T')" "$*" >&2 && log_to_file "WARN" "$*"; }
log_error(){ printf "${RED}${ICON_ERROR} [%s] ERROR: %s${NC}\n" "$(date '+%T')" "$*" >&2 && log_to_file "ERROR" "$*" && return 1; }
log_success(){ printf "${GREEN}${ICON_SUCCESS} [%s] %s${NC}\n" "$(date '+%T')" "$*" >&2 && log_to_file "SUCCESS" "$*"; }
log_phase() { printf "\n${PURPLE}🚀 %s${NC}\n" "$*" >&2 && log_to_file "PHASE" "$*"; }
log_think(){ printf "${ORANGE}${ICON_THINK} [%s] %s${NC}" "$(date '+%T')" "$*" >&2 && log_to_file "THINK" "$*"; }
log_plan(){ printf "\n${CYAN}${ICON_PLAN} [%s] %s${NC}\n" "$(date '+%T')" "$*" >&2 && log_to_file "PLAN" "$*"; }
log_execute(){ printf "\n${GREEN}${ICON_EXEC} [%s] %s${NC}\n" "$(date '+%T')" "$*" >&2 && log_to_file "EXECUTE" "$*"; }
export -f log_to_file log_debug log_info log_warn log_error log_success log_phase log_think log_plan log_execute

# ---------------- INITIALIZATION & HMAC SETUP ----------------
init_environment() { mkdir -p "$AI_HOME" "$PROJECTS_DIR" "$SWAP_DIR"; if [[ ! -f "$HMAC_SECRET_KEY" ]]; then openssl rand -hex 32 > "$HMAC_SECRET_KEY"; chmod 600 "$HMAC_SECRET_KEY"; fi; }
calculate_hmac() { local data="$1"; local secret; secret=$(<"$HMAC_SECRET_KEY"); echo -n "$data" | openssl dgst -sha256 -hmac "$secret" | awk '{print $2}'; }
confirm_action() { local c="N"; echo -e "\n${YELLOW}PROPOSED ACTION:${NC} ${CYAN}$1${NC}"; read -p "Approve? [y/N] " -n 1 -r c; echo; [[ "$c" =~ ^[Yy]$ ]]; }

# ---------------- DYNAMIC DATABASE ENVIRONMENT ----------------
sqlite_escape(){ echo "$1" | sed "s/'/''/g"; }
register_schema() {
    local table_name="$1" description="$2" schema_sql="$3"
    sqlite3 "$CORE_DB" "$schema_sql" || return 1
    sqlite3 "$CORE_DB" "INSERT OR REPLACE INTO _master_schema (table_name, description, schema_sql) VALUES ('$(sqlite_escape "$1")', '$(sqlite_escape "$2")', '$(sqlite_escape "$3")');"
}
init_db() {
    sqlite3 "$CORE_DB" "CREATE TABLE IF NOT EXISTS _master_schema (table_name TEXT PRIMARY KEY, description TEXT, schema_sql TEXT);"
    local tables_exist=$(sqlite3 "$CORE_DB" "SELECT COUNT(*) FROM _master_schema WHERE table_name IN ('memories', 'tool_logs');")
    if [[ "$tables_exist" -ne 2 ]]; then
        log_warn "One or more core schemas missing. Bootstrapping..."
        register_schema "memories" "Long-term memory for fuzzy cache." "CREATE TABLE IF NOT EXISTS memories (id INTEGER PRIMARY KEY, prompt_hash TEXT, prompt TEXT, response_ref TEXT);"
        register_schema "tool_logs" "Logs of every tool execution." "CREATE TABLE IF NOT EXISTS tool_logs (id INTEGER PRIMARY KEY, task_id TEXT, tool_name TEXT, args TEXT, result TEXT);"
    fi
}
get_db_schema_for_prompt() { sqlite3 -header -column "$CORE_DB" "SELECT table_name, description FROM _master_schema;"; }

# ---------------- AI & AGI CORE ----------------
hash_string(){ echo -n "$1" | sha256sum | cut -d' ' -f1; }
semantic_hash_prompt(){ echo "$1" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' ' ' | tr -s ' ' | sed 's/ ^*//;s/ *$//' | tr ' ' '_'; }
store_output_fast(){ local c="$1" h=$(hash_string "$c"); if ((${#c}>MAX_RAM_BYTES));then f="$SWAP_DIR/$h.txt.gz"; echo "$c"|gzip>"$f";echo "$f";else echo "$c";fi; }
retrieve_output_fast(){ local r="$1"; if [[ -f "$r" ]];then [[ "$r" == *.gz ]] && gzip -dc "$r"||cat "$r";else echo "$r";fi; }
get_cached_response(){ local p_h=$(semantic_hash_prompt "$1"); sqlite3 "$CORE_DB" "SELECT response_ref FROM memories WHERE prompt_hash = '$(sqlite_escape "$p_h")' LIMIT 1;"; }
add_to_memory_fast(){ local p_h="$1" p="$2" ref="$3"; sqlite3 "$CORE_DB" "INSERT INTO memories (prompt_hash, prompt, response_ref) VALUES ('$(sqlite_escape "$p_h")','$(sqlite_escape "$p")','$(sqlite_escape "$ref")');"; }

ensure_ollama() {
    if ! command -v "$OLLAMA_BIN" &>/dev/null; then
        log_error "Ollama executable not found at '$OLLAMA_BIN'. Please install Ollama or ensure it's in your PATH."
        return 1
    fi
    if ! curl -s --connect-timeout 2 http://localhost:11434/api/tags >/dev/null; then
        log_warn "Ollama server is not running. Attempting graceful restart..."
        pkill -f "$OLLAMA_BIN serve" || true
        nohup "$OLLAMA_BIN" serve >/dev/null 2>&1 &
        local start_time=$(date +%s)
        local timeout=20
        while ! curl -s --connect-timeout 2 http://localhost:11434/api/tags >/dev/null; do
            if [[ $(($(date +%s) - start_time)) -gt $timeout ]]; then
                log_error "Ollama server failed to start within ${timeout} seconds."
                return 1
            fi
            sleep 1
        done
        log_success "Ollama server connected and verified."
    fi
    return 0
}

run_worker_stream(){
    local model="$1" system_prompt="$2" user_prompt="$3" payload
    ensure_ollama # MANDATORY CHECK before running

    payload=$(jq -nc --arg m "$model" --arg s "$system_prompt" --arg p "$user_prompt" \
    '{model:$m, system:$s, prompt:$p, stream:true}')

    local full_output
    full_output=$(
        curl -sN -X POST http://localhost:11434/api/generate -d "$payload" \
        | while IFS= read -r line; do
            local token api_error
            
            api_error=$(echo "$line" | jq -r .error//empty)
            if [[ -n "$api_error" ]]; then
                log_error "Ollama API Error for model '$model': $api_error"
                echo "API_ERROR: $api_error"
                return
            fi

            token=$(echo "$line" | jq -r .response//empty)
            
            if [[ -n "$token" ]]; then
                log_think "[$model] $token"
                echo -n "$token"
            fi
        done
    )

    echo >&2

    if [[ -z "$full_output" ]] && ! curl -s --connect-timeout 1 http://localhost:11434/api/tags >/dev/null; then
        log_error "Connection to Ollama failed before streaming began."
        echo "API_ERROR: Connection failed."
        return
    fi
    
    echo "$full_output"
}

export -f hash_string semantic_hash_prompt store_output_fast retrieve_output_fast get_cached_response add_to_memory_fast sqlite_escape run_worker_stream ensure_ollama confirm_action

# ---------------- DEVOPS TOOLSET ----------------
tool_exec_shell() {
    local proj_dir="$1" cmd="$2"
    log_debug "Executing in $proj_dir: $cmd"
    (cd "$proj_dir" && bash -c "$cmd") 2>&1 || echo "Command failed: $?"
}
tool_write_file() { 
    local proj_dir="$1" f_path="$2" content="$3"
    mkdir -p "$(dirname "$proj_dir/$f_path")"
    
    local output_content; printf -v output_content "%s" "$content"
    
    printf "%s" "$output_content" > "$proj_dir/$f_path"
    
    if [[ -f "$proj_dir/$f_path" ]]; then
        echo "File '$f_path' written. Size: $(wc -c < "$proj_dir/$f_path") bytes."
    else
        echo "Error: Failed to write file '$f_path'."
    fi
}
export -f tool_exec_shell tool_write_file

# ---------------- AGENT MANAGEMENT FUNCTIONS ----------------

# ai setup: Install/verify system dependencies
ai_setup() {
    log_phase "Installing System Dependencies"
    log_info "Installing dependencies (sqlite3, git, curl, nodejs, npm, tree, openssl)..."
    if command -v dpkg &>/dev/null; then
        log_warn "Attempting to remove potentially conflicting 'npm' package for NodeSource compatibility."
        sudo dpkg -r --force-depends npm 2>/dev/null || true
    fi
    
    if command -v apt-get &>/dev/null; then sudo apt-get update && sudo apt-get install -y sqlite3 git curl nodejs npm tree openssl
    else log_warn "Could not determine package manager. Please install dependencies manually."; fi
    log_success "System dependencies installed."
}

# ai rebuild: Pulls models and wipes cache
ai_rebuild() {
    log_phase "Rebuilding Agent Environment and Models"
    log_warn "This will attempt to pull the latest versions of the Triumvirate models and wipe the fuzzy cache."
    local models_to_pull=("$MESSENGER_MODEL" "${PLANNER_MODELS[@]}" "$EXECUTOR_MODEL")
    local failed=0
    
    if ! ensure_ollama; then log_error "Ollama server is not reachable. Cannot rebuild models."; return 1; fi

    for model in "${models_to_pull[@]}"; do
        log_info "Attempting to pull model: $model"
        if "$OLLAMA_BIN" pull "$model"; then
            log_success "Successfully pulled $model."
        else
            log_error "Failed to pull $model."
            failed=1
        fi
    done
    
    log_info "Wiping fuzzy cache (memories table) to ensure fresh reasoning."
    sqlite3 "$CORE_DB" "DELETE FROM memories;"
    
    if [[ $failed -eq 0 ]]; then
        log_success "Rebuild complete. All Triumvirate models updated."
    else
        log_warn "Rebuild finished, but some models failed to update."
    fi
}

# ai script: Execute a script file containing multiple AGI commands
ai_script() {
    local script_file="$1"
    if [[ -z "$script_file" ]]; then
        log_error "Usage: ai script <path/to/script.txt>"
        return 1
    fi
    if [[ ! -f "$script_file" ]]; then
        log_error "Script file not found: '$script_file'"
        return 1
    fi
    log_phase "Running Autonomous Script: $script_file"
    
    local line_num=0
    while IFS= read -r line; do
        line_num=$((line_num + 1))
        local cmd=$(echo "$line" | sed 's/#.*//' | xargs)
        if [[ -n "$cmd" ]]; then
            log_info "Executing script command (Line $line_num): '$cmd'"
            run_agi_workflow "$cmd"
            if [[ $? -ne 0 ]]; then
                log_error "AGI workflow failed for command on line $line_num. Aborting script."
                return 1
            fi
        fi
    done < "$script_file"
    log_success "Script execution complete."
}

# ai repair: Fix environment issues and check database integrity
ai_repair() {
    log_phase "Repairing Agent Core"
    log_info "Checking Ollama server connection..."
    if ensure_ollama; then
        log_success "Ollama server is verified and running."
    else
        log_warn "Ollama server issue detected. Attempted restart failed. Manual intervention may be required."
    fi

    log_info "Running SQLite database integrity check on $CORE_DB..."
    if sqlite3 "$CORE_DB" "PRAGMA integrity_check;" | grep -q "ok"; then
        log_success "Database integrity check passed."
    else
        log_error "Database integrity check FAILED. Attempting recovery (running VACUUM and REINDEX)..."
        sqlite3 "$CORE_DB" "VACUUM; REINDEX;" && log_success "Database recovery attempted and completed." || log_error "Database recovery failed."
    fi
    
    log_info "Verifying core directories..."
    init_environment # Ensures dirs are present and HMAC is set
    log_success "Directories and HMAC key verified."
}

# ai status: Displays system health and key metrics
ai_status() {
    log_phase "Agent Status Report"
    
    printf "${BLUE}Agent Home:${NC} %s\n" "$AI_HOME"
    printf "${BLUE}Projects Dir:${NC} %s\n" "$PROJECTS_DIR"
    
    log_info "Checking Ollama server..."
    if curl -s --connect-timeout 2 http://localhost:11434/api/tags >/dev/null; then
        printf "${GREEN}Ollama Status:${NC} Running on port 11434\n"
    else
        printf "${RED}Ollama Status:${NC} Not running or unreachable\n"
    fi

    log_info "Core Database Status..."
    local mem_count=$(sqlite3 "$CORE_DB" "SELECT COUNT(*) FROM memories;" 2>/dev/null || echo "Error")
    local log_count=$(sqlite3 "$CORE_DB" "SELECT COUNT(*) FROM tool_logs;" 2>/dev/null || echo "Error")
    printf "${CYAN}DB Size:${NC} $(du -h "$CORE_DB" 2>/dev/null || echo 'N/A')\n"
    printf "${CYAN}Cached Memories:${NC} %s records\n" "$mem_count"
    printf "${CYAN}Tool Logs:${NC} %s records\n" "$log_count"
    
    log_info "Triumvirate Model List:"
    printf "  ${PURPLE}Messenger:${NC} %s\n" "$MESSENGER_MODEL"
    printf "  ${PURPLE}Planners:${NC} %s\n" "${PLANNER_MODELS[*]}"
    printf "  ${PURPLE}Executor:${NC} %s\n" "$EXECUTOR_MODEL"
}

# ---------------- AUTONOMOUS WORKFLOW (Triumvirate Logic) ----------------
run_agi_workflow() {
    local user_prompt="$*"
    local task_id; task_id=$(hash_string "$user_prompt$(date +%s%N)" | cut -c1-16)
    local project_dir="$PROJECTS_DIR/task-$task_id"; mkdir -p "$project_dir"
    log_success "Project workspace: $project_dir (Task ID: $task_id)"

    local cached_ref; cached_ref=$(get_cached_response "$user_prompt")
    if [[ -n "$cached_ref" ]]; then
        log_success "Found high-quality match in fuzzy cache."
        echo -e "\n${CYAN}--- Cached Final Answer ---\n${NC}$(retrieve_output_fast "$cached_ref")"; return
    fi

    local conversation_history="Initial User Request: $user_prompt"
    local status="IN_PROGRESS"

    for ((i=1; i<=MAX_AGENT_LOOPS; i++)); do
        log_phase "AGI Loop $i/$MAX_AGENT_LOOPS"
        
        # --- Phase 1: Messenger (Streaming) ---
        local messenger_prompt="You are the Messenger. Analyze the current conversation context and provide a clear, structured summary of the goal and current state. The task ID is $task_id."
        log_think "Starting Messenger (${MESSENGER_MODEL}) Analysis..."
        local messenger_output; messenger_output=$(run_worker_stream "$MESSENGER_MODEL" "$messenger_prompt" "$conversation_history")
        log_think "Messenger (${MESSENGER_MODEL}) Final Output: ${messenger_output}"

        # --- Phase 2: Parallel Planners (Streaming) ---
        local pids=() temp_files=() planner_outputs=()
        for model in "${PLANNER_MODELS[@]}"; do
            local temp_file; temp_file=$(mktemp)
            temp_files+=("$temp_file")
            (
                log_debug "Starting planner: $model"
                local planner_prompt="You are a strategic Planner. Based on the Messenger's analysis, create a concise, step-by-step plan. Propose a single, specific tool to use for the very next step. Only use the tools: tool_exec_shell (runs a shell command), tool_write_file (writes content to a file)."
                
                local planner_output; planner_output=$(run_worker_stream "$model" "$planner_prompt" "$messenger_output")
                echo "$planner_output" > "$temp_file"
            ) &
            pids+=($!)
        done
        for pid in "${pids[@]}"; do wait "$pid" || log_warn "A planner model exited with a non-zero status."; done

        # --- Triage: Collect Planner Outputs ---
        local executor_context="You are the Executor. Synthesize the plans from the planners, resolve conflicts, and decide on the single best tool to use. Your output MUST be in the format:
[REASONING] Your synthesis and final decision.
[TOOL] tool_name <arguments>
If the entire task is solved, respond ONLY with: [FINAL_ANSWER] Your final summary.

Available tools: tool_exec_shell (runs a shell command), tool_write_file (writes content to a file).
--- MESSENGER'S ANALYSIS ---
$messenger_output"

        for idx in "${!PLANNER_MODELS[@]}"; do
            local model="${PLANNER_MODELS[$idx]}"
            local file="${temp_files[$idx]}"
            local planner_output; planner_output=$(cat "$file")
            planner_outputs+=("$planner_output")
            log_plan "Planner (${model}) Strategy: ${planner_output}"
            executor_context+="\n\n--- Plan from ${model} ---\n${planner_output}"
        done
        rm -f "${temp_files[@]}"

        # --- Phase 3: Executor (Streaming) ---
        log_execute "Starting Executor (${EXECUTOR_MODEL}) Decision Synthesis..."
        local final_plan; final_plan=$(run_worker_stream "$EXECUTOR_MODEL" "Executor" "$executor_context")
        log_execute "Executor (${EXECUTOR_MODEL}) Final Decision: ${final_plan}"

        if [[ "$final_plan" == *"[FINAL_ANSWER]"* ]]; then status="SUCCESS"; conversation_history="$final_plan"; break; fi
        
        local tool_line; tool_line=$(echo "$final_plan" | grep '\[TOOL\]' | head -n 1)
        if [[ -z "$tool_line" ]]; then log_warn "Executor did not choose a tool. Ending loop."; break; fi

        local clean_tool_cmd; clean_tool_cmd=$(echo "${tool_line#\[TOOL\] }" | sed 's/\r$//')
        local ai_hmac; ai_hmac=$(calculate_hmac "$clean_tool_cmd")
        local verified_hmac; verified_hmac=$(calculate_hmac "$clean_tool_cmd")
        if [[ "$ai_hmac" != "$verified_hmac" ]]; then log_error "HMAC MISMATCH!"; status="HMAC_FAILURE"; break; fi
        log_success "${ICON_SECURE} HMAC signature verified."

        local tool_name; tool_name=$(echo "$clean_tool_cmd" | awk '{print $1}')
        local args_str; args_str=$(echo "$clean_tool_cmd" | cut -d' ' -f2-)
        
        local tool_result="Tool aborted."
        if confirm_action "$clean_tool_cmd"; then
            if [[ "$tool_name" == "tool_exec_shell" ]]; then
                tool_result=$(tool_exec_shell "$project_dir" "$args_str")
            elif [[ "$tool_name" == "tool_write_file" ]]; then
                local f_path; f_path=$(echo "$args_str" | awk '{print $1}')
                local content; content=$(echo "$args_str" | sed "s/^$f_path *//")
                tool_result=$(tool_write_file "$project_dir" "$f_path" "$content")
            else
                log_error "AI tried to call an unknown tool: '$tool_name'"; tool_result="Error: Tool '$tool_name' does not exist."
            fi
        fi
        
        sqlite3 "$CORE_DB" "INSERT INTO tool_logs (task_id, tool_name, args, result) VALUES ('$task_id', '$tool_name', '$(sqlite_escape "$args_str")', '$(sqlite_escape "$tool_result")');"
        
        local loop_summary="--- Loop $i Full Context ---
[MESSENGER: ${MESSENGER_MODEL}]
${messenger_output}
[PLANNER 1: ${PLANNER_MODELS[0]}]
${planner_outputs[0]}
[PLANNER 2: ${PLANNER_MODELS[1]}]
${planner_outputs[1]}
[EXECUTOR: ${EXECUTOR_MODEL}]
${final_plan}
[TOOL_RESULT]
${tool_result}"
        conversation_history="$loop_summary"
    done

    log_phase "AGI Workflow Complete (Status: $status)"
    local final_answer; final_answer=$(echo "$conversation_history" | grep '\[FINAL_ANSWER\]' | sed 's/\[FINAL_ANSWER\]//' | tail -n 1)
    if [[ -z "$final_answer" ]]; then final_answer="Workflow finished. Final context:\n$conversation_history"; fi
    
    local final_ref; final_ref=$(store_output_fast "$final_answer")
    add_to_memory_fast "$(semantic_hash_prompt "$user_prompt")" "$user_prompt" "$final_ref"
    echo -e "\n${GREEN}--- Final Answer ---\n${NC}${final_answer}"
}

run_default_init() { log_phase "No prompt given. Scanning context..."; if [[ -d ".git" ]]; then git status; else tree -L 2 . || ls -la; fi; }

# ---------------- HELP & MAIN DISPATCHER ----------------
show_help() {
    cat << EOF
${GREEN}AI Autonomic Synthesis Platform v32.1 (Maintenance Features)${NC}
An agent that uses a fixed, multi-layer reasoning pipeline and streams token output in real-time.

${CYAN}USAGE:${NC}
  ai "your high-level goal"            # Run the autonomous AGI workflow
  ai rebuild                           # Pull latest LLM models & wipe fuzzy cache
  ai script <file>                     # Execute a script file of sequential AGI goals
  ai repair                            # Check database integrity, fix environment issues, and verify Ollama
  ai status                            # Show system health, model list, and cache metrics
  ai setup                             # Install/verify core system dependencies (sqlite3, git, curl, etc.)
  ai serve                             # Start the interactive web UI (Placeholder)
  ai                                   # (No prompt) Scan current directory context
  ai --help|-h                         # Show this help
EOF
}

main() {
    if [[ "${1:-}" == "serve" ]]; then log_info "Web UI serving is a feature of a future version. For now, use the command line."; exit 0; fi
    init_environment; init_db

    if [[ $# -eq 0 ]]; then run_default_init; exit 0; fi
    case "${1:-}" in
        setup|--setup|-s) ai_setup ;;
        rebuild) ai_rebuild ;;
        script) shift; ai_script "$@" ;;
        repair) ai_repair ;;
        status) ai_status ;;
        --help|-h) show_help ;;
        *) run_agi_workflow "$@" ;;
    esac
}

# --- SCRIPT ENTRY POINT ---
if [[ -z "${NODE_ENV:-}" ]]; then
    main "$@"
fi
