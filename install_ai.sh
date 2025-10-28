#!/bin/bash
# install_ai.sh - Autonomic Synthesis Platform Installer
# Version 1.2.0 - Fully Robust Multi-Manager Dependency Handler
# Installs all system (apt), Node.js (npm), and Python (pip) dependencies
# required to run the ai.sh orchestration script.

set -euo pipefail

# --- Configuration ---
VERSION="1.2.0"
AI_INSTALL_DIR="${HOME}/.ai_platform_cli"
AI_SCRIPT_NAME="ai.sh"
AI_SYMLINK_NAME="/usr/local/bin/ai"
AI_SCRIPT_PATH="$AI_INSTALL_DIR/$AI_SCRIPT_NAME"

# --- Dependency Lists ---
APT_DEPS="sqlite3 curl jq gzip file shellcheck" 
PIP_DEPS="requests"
NPM_DEPS="commander node-fetch"

# --- Utility Functions (Omitted for brevity of the installer) ---
log() { echo -e "\n\e[1;34m[INFO]\e[0m \e[37m$1\e[0m"; }
warn() { echo -e "\n\e[1;33m[WARN]\e[0m \e[33m$1\e[0m"; }
fail() { echo -e "\n\e[1;31m[FAIL]\e[0m \e[31m$1\e[0m"; exit 1; }

check_manager() {
    if ! command -v "$1" &> /dev/null; then
        warn "Package manager '$1' not found. Skipping $2 dependency check/installation."
        return 1
    fi
    return 0
}

# --- Installation Steps ---

install_apt_deps() {
    log "1. Installing core system dependencies ($APT_DEPS) via apt..."
    if check_manager "apt" "apt"; then
        sudo apt update
        for dep in $APT_DEPS; do
            if ! dpkg -s "$dep" &> /dev/null; then
                log "Installing: $dep"
                sudo apt install -y "$dep" || warn "Could not install $dep. Please install manually."
            else
                log "Dependency $dep is already installed."
            fi
        done
    fi
}

install_npm_deps() {
    log "2. Installing Node.js dependencies ($NPM_DEPS) via npm..."
    if check_manager "npm" "npm"; then
        if ! command -v node &> /dev/null; then
            warn "Node.js not found. Please install Node.js (v18+) for full functionality."
            return 1
        fi
        
        mkdir -p "$AI_INSTALL_DIR"
        if [ ! -f "$AI_INSTALL_DIR/package.json" ]; then
            log "Initializing npm project in $AI_INSTALL_DIR..."
            echo "{ \"name\": \"ai-platform-deps\", \"version\": \"$VERSION\", \"private\": true }" > "$AI_INSTALL_DIR/package.json"
        fi
        
        log "Running npm install..."
        sudo npm install -g $NPM_DEPS || warn "npm global installation failed. Check npm setup."
    fi
}

install_pip_deps() {
    log "3. Installing Python dependencies ($PIP_DEPS) via pip..."
    if check_manager "python3" "python3"; then
        if command -v pip &> /dev/null || command -v pip3 &> /dev/null; then
            log "Upgrading pip and installing packages: $PIP_DEPS"
            python3 -m pip install --upgrade pip
            python3 -m pip install $PIP_DEPS || warn "pip installation failed. Check Python environment setup."
        else
            warn "pip/pip3 not found. Skipping Python dependency installation."
        fi
    fi
}

create_cli_symlink() {
    log "5. Creating CLI symlink ($AI_SYMLINK_NAME)..."
    if [ -f "$AI_SCRIPT_PATH" ]; then
        if sudo ln -sf "$AI_SCRIPT_PATH" "$AI_SYMLINK_NAME"; then
            log "Symlink created successfully. You can now run 'ai [command]'."
        else
            fail "Could not create symlink. Check permissions or manually link the script: $AI_SCRIPT_PATH"
        fi
    else
        fail "AI script not found in $AI_INSTALL_DIR. Installation failed."
    fi
}

copy_main_script() {
    log "4. Copying the main AI script to $AI_SCRIPT_PATH..."
    
    mkdir -p "$AI_INSTALL_DIR"
    
    # --- Start Script Content (Final Corrected Bash Version) ---
    # NOTE: The outer delimiter is quoted to prevent variable expansion of inner content.
    cat > "$AI_SCRIPT_PATH" <<'AI_SCRIPT_CONTENT_END'
#!/bin/bash
# Autonomic Synthesis Platform (ASP) - Full Verbosity Edition
# Multi-model reasoning framework with parallel execution and memory
# Version 1.2.0 - Optimized for Holistic Verbosity and Detailed Context
#
# This version replaces old simulations with core AI enhancement functions 
# demonstrating full agent capabilities.

set -euo pipefail

#--- Core Configuration: The Agent Manifest (Holistic Verbosity Focus) ---
VERSION="1.2.0"
AUTHOR="2244-1"

# Agent Manifest: Defines the 5 core reasoning agents and their specializations.
declare -A AGENT_MANIFEST=(
    ["code"]="ALGORITHMICAL: Provide expressive, fully detailed analysis with comprehensive code examples and deep technical background."
    ["coin"]="BIOLOGICAL: Offer extensive, emotionally and contextually rich analysis, detailing mood shifts and historical significance."
    ["2244"]="CHEMICAL: Deliver exhaustive multilingual responses, deeply exploring cultural and linguistic nuances in both German and English."
    ["core"]="PHYSICAL: Present an in-depth, structured decomposition of the problem, detailing every logical step and counter-argument considered."
    ["loop"]="LOGICAL: Generate lengthy, refined answers that fully articulate the synthesis process and justify every decision through exhaustive feedback integration."
)

# Database paths (The Collective Memory)
DB_DIR="${HOME}/_/.ai_platform"
CORE_DB="${DB_DIR}/core.db"
SWAP_DIR="${DB_DIR}/swap"
LOG_FILE="${DB_DIR}/ai.log"
mkdir -p "$DB_DIR" "$SWAP_DIR"

# OLLAMA configuration (The Inference Engine)
OLLAMA_BASE="http://localhost:11434"
DEFAULT_MODEL="deepseek-v3.1:671b-cloud"

#--- Database Initialization (No change) ---
init_database(){
sqlite3 "$CORE_DB" <<'EOF' 
CREATE TABLE IF NOT EXISTS mindflow(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    prompt_hash TEXT,
    loop_number INTEGER,
    model_name TEXT,
    output_text TEXT,
    ranking_score REAL,
    language TEXT,
    mood_context TEXT
);
CREATE TABLE IF NOT EXISTS task_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,task_type TEXT,task_input TEXT,task_output TEXT,metadata TEXT);
CREATE TABLE IF NOT EXISTS model_rankings(model_name TEXT PRIMARY KEY,total_votes INTEGER DEFAULT 0,avg_score REAL DEFAULT 0.0,last_used DATETIME);
CREATE INDEX IF NOT EXISTS idx_mindflow_hash ON mindflow(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_mindflow_loop ON mindflow(loop_number);
EOF
}

# ... (Logging, Hashing, Compression functions remain the same) ...
#--- Logging System---
log_event(){
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}
#--- Hashing Utilities---
hash_string(){
    echo -n "$1" | sha256sum | cut -d ' ' -f1
}
hash_file(){
    if [[ -f "$1" ]]; then
        sha256sum "$1" | cut -d ' ' -f1
    else
        echo "File not found: $1" >& 2
        return 1
    fi
}
hash_directory(){
    local dir="$1"
    find "$dir" -type f -exec sha256sum {} + 2>/dev/null | \
    sort -k2 | sha256sum | cut -d ' ' -f1
}
#--- Compression & Swap Management---
cleanup_swap_dir(){
    local days="${1:-30}"
    log_event "INFO" "Cleaning up swap directory older than $days days..."
    find "$SWAP_DIR" -type f -mtime +"$days" -exec rm -f {} \; 2>/dev/null
}
compress_store(){
    local content="$1"
    local hash=$(hash_string "$content")
    local swap_file="${SWAP_DIR}/${hash}.gz"
    echo "$content" | gzip -c > "$swap_file"
    echo "$hash"
}
retrieve_swap(){
    local hash="$1"
    local swap_file="${SWAP_DIR}/${hash}.gz"
    if [[ -f "$swap_file" ]]; then
        zcat "$swap_file" 2>/dev/null
    else
        return 1
    fi
}
#--- Agent Execution Functions (System Prompts remain the same) ---
run_agent_code(){
    local system_msg="You are the expert ALGORITHMICAL REASONING AGENT. Provide detailed, logical analysis with code examples when appropriate. Focus on algorithms, data structures, and technical implementation."
    call_ollama_model "$system_msg" "$1" "$2" "code"
}
run_agent_coin(){
    local mood_context=$(get_mood_context)
    local time_context=$(get_time_context)
    local system_msg="You are the BIOLOGICAL AGENT. You understand mood, time, and historical context. Current context: $mood_context, $time_context. Respond with emotional intelligence and contextual awareness."
    call_ollama_model "$system_msg" "$1" "$2" "coin"
}
run_agent_2244(){
    local preferred_lang=$(detect_preferred_language "$1")
    local system_msg="You are the CHEMICAL AGENT. You prioritize language appropriateness. Preferred language: $preferred_lang. Switch between German and English as needed for optimal communication."
    call_ollama_model "$system_msg" "$1" "$2" "2244"
}
run_agent_core(){
    local system_msg="You are the PHYSICAL AGENT. Focus on logical analysis, problem decomposition, and fundamental understanding. Break down complex problems and provide structured reasoning."
    call_ollama_model "$system_msg" "$1" "$2" "core"
}
run_agent_loop(){
    local system_msg="You are the LOGICAL AGENT (Iterative Improvement Loop). Focus on synthesizing previous outputs, identifying gaps, and providing enhanced, refined answers through continuous improvement cycles."
    call_ollama_model "$system_msg" "$1" "$2" "loop"
}

#--- Core OLLAMA Integration (Streamlined for Direct Connection) ---
call_ollama_model(){
    local system_msg="$1"
    local prompt="$2"
    local context="$3"
    local model_type="$4"
    local full_prompt=$(assemble_prompt "$prompt" "$context" "$model_type")
    
    local response
    response=$(curl -s -X POST "${OLLAMA_BASE}/api/generate" \
        -H "Content-Type: application/json" \
        -d "$(jq -nc \
            --arg model "$DEFAULT_MODEL" \
            --arg system "$system_msg" \
            --arg prompt "$full_prompt" \
            '{model: $model,system: $system,prompt: $prompt,stream: false,options:{temperature: 0.7,top_p: 0.9,top_k: 40}}')" 2>/dev/null || echo '{"response": "API_ERROR"}')
    
    local extracted_response
    extracted_response=$(echo "$response" | jq -r '.response' 2>/dev/null)
    
    if [[ "$extracted_response" == "API_ERROR" ]]; then
        log_event "WARNING" "OLLAMA server unavailable or API error for $model_type. Using fallback."
        generate_fallback_response "$prompt" "$model_type"
    else
        echo "$extracted_response"
    fi
}

# ... (Context Management and Fallback functions remain the same) ...
#--- Context Management---
get_mood_context(){
    local hour=$(date +%H)
    local mood=""
    case "$hour" in
        06|07|08|09|10|11) mood="morning_fresh";;
        12|13|14|15|16|17) mood="day_productive";;
        18|19|20|21|22) mood="evening_reflective";;
        *) mood="night_creative";;
    esac
    local emotions=("focused" "curious" "analytical" "creative" "empathetic")
    local random_emotion="${emotions[$RANDOM % ${#emotions[@]}]}"
    echo "${mood}_${random_emotion}"
}
get_time_context(){
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local day_of_week=$(date '+%A')
    echo "${day_of_week}_${timestamp}"
}
detect_preferred_language(){
    local prompt="$1"
    if [[ "$prompt" =~ [äöüÄÖÜß] ]]; then
        echo "German"
    elif [[ "$prompt" =~ [a-zA-Z] ]]; then
        echo "English"
    else
        echo "English"
    fi
}
assemble_prompt(){
    local prompt="$1"
    local context="$2"
    local model_type="$3"
    cat <<EOF
Original Prompt: $prompt
Context from previous iterations: $context
Model Role: ${AGENT_MANIFEST[$model_type]}

Please provide your analysis and reasoning.
If you reach a definitive conclusion, mark it with [FINAL_ANSWER].
EOF
}
#--- Fallback Response Generation---
generate_fallback_response(){
    local prompt="$1"
    local model_type="$2"
    local fallback_msg=""
    case "$model_type" in
        "code") fallback_msg="Technical analysis: Code Agent offline. The problem requires a systematic approach to algorithm design.";;
        "coin") fallback_msg="Contextual analysis: Current systems offline. In such moments, reflection often reveals alternative perspectives worth exploring.";;
        "2244") fallback_msg="Sprachanalyse derzeit nicht verfügbar. Fallback: Die Fragestellung erfordert weitere Betrachtung aus verschiedenen Blickwinkeln.";;
        "core") fallback_msg="Core reasoning temporarily unavailable. Logical fallback: decompose problem into smaller subproblems and address each systematically.";;
        "loop") fallback_msg="Iterative synthesis paused. Consider previous outputs and identify convergence patterns for optimal solution integration.";;
        *) fallback_msg="Analysis unavailable. Please try again when AI systems are fully operational.";;
    esac
    echo "[FALLBACK]$fallback_msg"
}

#--- Phase 1: Agent Deployment (Parallel Race) (No change) ---
execute_model_race(){
    local prompt="$1"
    local context="$2"
    local -n results_array="$3"
    local pids=()
    local temp_files=()

    for model in "${!AGENT_MANIFEST[@]}"; do
        local temp_file=$(mktemp)
        temp_files+=("$temp_file")
        case "$model" in
            "code") run_agent_code "$prompt" "$context" > "$temp_file" & ;;
            "coin") run_agent_coin "$prompt" "$context" > "$temp_file" & ;;
            "2244") run_agent_2244 "$prompt" "$context" > "$temp_file" & ;;
            "core") run_agent_core "$prompt" "$context" > "$temp_file" & ;;
            "loop") run_agent_loop "$prompt" "$context" > "$temp_file" & ;;
        esac
        pids+=($!)
    done

    for pid in "${pids[@]}"; do
        wait "$pid"
    done

    local i=0
    for model in "${!AGENT_MANIFEST[@]}"; do
        results_array["$model"]=$(< "${temp_files[$i]}")
        rm -f "${temp_files[$i]}"
        ((i++))
    done
}

#--- Phase 2 & 3: Ranking, Scoring (FPI), and Synthesis (Fusion) ---
rank_and_fuse_outputs(){
    local -n model_outputs="$1"
    local loop_number="$2"
    local prompt_hash="$3"
    declare -A scores
    declare -A rankings

    for model in "${!model_outputs[@]}"; do
        local score=$(calculate_output_score "${model_outputs[$model]}" "$model")
        scores["$model"]=$score
    done

    local sorted_models
    sorted_models=$(for model in "${!scores[@]}"; do echo "${scores[$model]} $model"; done | sort -rn | cut -d ' ' -f2)
    
    local rank=1
    for model in $sorted_models; do
        rankings["$model"]=$rank
        ((rank++))
    done

    for model in "${!model_outputs[@]}"; do
        store_model_output "$prompt_hash" "$loop_number" "$model"\
            "${model_outputs[$model]}" "${scores[$model]}" "${rankings[$model]}"
    done

    fuse_weighted_outputs model_outputs scores
}

# FPI Scoring: Reward Verbosity and Normalized Base Weights
calculate_output_score(){
    local output="$1"
    local model="$2"
    local score=0
    
    # REWARD VERBOSITY: Highly increased Length Factor to heavily reward verbosity (0.5 score per word -> 50 per word)
    local length=$(echo "$output" | wc -w)
    score=$((score + length * 50)) 

    # Final Answer Protocol Bonus: 50.0 score -> 5000 in scaled integer
    if [[ "$output" == *"[FINAL_ANSWER]"* ]]; then
        score=$((score + 5000))
    fi
    
    # NORMALIZED BASE WEIGHTS: Similar starting weight for all.
    case "$model" in
        "core") score=$((score + 1000));; 
        "loop") score=$((score + 900));;  
        "code") score=$((score + 800));;  
        "coin") score=$((score + 700));;  
        "2244") score=$((score + 600));;  
        *)      score=$((score + 500));;
    esac

    # Agent Failure Protocol Penalty: Penalize [FALLBACK] heavily
    if [[ "$output" == *"[FALLBACK]"* ]]; then
        score=$((score - 10000))
    fi
    echo "$score"
}

fuse_weighted_outputs(){
    local -n outputs="$1"
    local -n weights="$2"
    local best_model=""
    local best_score=-1
    for model in "${!weights[@]}"; do
        local score="${weights[$model]}"
        if [[ $score -gt $best_score ]]; then
            best_score=$score
            best_model=$model
        fi
    done
    echo "${outputs[$best_model]}"
}

#--- Database Operations (No change) ---
store_model_output(){
    local prompt_hash="$1"
    local loop_number="$2"
    local model_name="$3"
    local output_text="$4"
    local ranking_score="$5"
    local ranking="$6"
    local language=$(detect_preferred_language "$output_text")
    local mood_context=$(get_mood_context)

    if [[ ${#output_text} -gt 1000 ]]; then
        local compressed_hash=$(compress_store "$output_text")
        output_text="COMPRESSED:$compressed_hash"
    fi

    sqlite3 "$CORE_DB" <<'EOF'
INSERT INTO mindflow(prompt_hash,loop_number,model_name,output_text,ranking_score,language,mood_context)
VALUES('$prompt_hash',$loop_number,'$model_name','$(sqlite3_escape "$output_text")',$ranking_score,'$language','$mood_context');
EOF
}

sqlite3_escape(){
    local str="$1"
    echo "$str" | sed "s/'/''/g"
}

#--- Main Reasoning Loop (Enhanced for Verbosity) ---
autonomic_reasoning(){
    local prompt="$1"
    local max_loops=5
    local prompt_hash=$(hash_string "$prompt")
    log_event "INFO" "Starting 5-Agent Assembly for prompt: ${prompt:0:50}..."
    local context=""
    local final_answer_detected=false

    for ((loop = 1; loop <= max_loops; loop++)); do
        echo -e "\n🔄 ASP Cycle $loop/$max_loops"
        echo "========================================"

        if [[ $loop -eq 1 ]]; then
            local cached=$(check_cached_response "$prompt_hash")
            if [[ -n "$cached" ]]; then
                echo "📚 Using cached reasoning results from Collective Memory"
                echo "$cached"
                return 0
            fi
        fi

        declare -A model_outputs
        execute_model_race "$prompt" "$context" model_outputs

        for model in "${!model_outputs[@]}"; do
            echo -e "\n🧠 Agent ${model^^}: ${AGENT_MANIFEST[$model]}"
            echo "----------------------------------------"
            local display_output="${model_outputs[$model]#[FALLBACK]}"
            echo "${display_output:0:200}..."
        done

        local fused_output=$(rank_and_fuse_outputs model_outputs "$loop" "$prompt_hash")
        
        # Build context for next iteration (FULL CONTEXT)
        context=$(build_context model_outputs "$loop")

        local display_fused_output="${fused_output#[FALLBACK]}"
        # Increased display output for greater immediate context
        echo -e "\n💡 Orchestrator Consensus (Cycle $loop):"
        echo "----------------------------------------"
        echo "${display_fused_output:0:500}..."

        if [[ "$fused_output" == *"[FINAL_ANSWER]"* ]]; then
            final_answer_detected=true
            echo -e "\n🎯 Final Answer Protocol detected!"
            break
        fi

        # NEW: Increased Loop extension heuristic threshold to 300 words
        if [[ $(echo "$fused_output" | wc -w) -lt 300 ]] && [[ $loop -lt $max_loops ]]; then
            echo -e "\n📈 Output is not yet exhaustive (word count < 300), extending max cycles..."
            ((max_loops++))
        fi
    done

    local final_output="${fused_output#[FALLBACK]}"
    store_task_log "reasoning" "$prompt" "$final_output" "loops=$loop,final=$final_answer_detected"
    echo -e "\n✅ Autonomic Synthesis Complete"
    echo "========================================"
    echo "$final_output"
}

check_cached_response(){
    local prompt_hash="$1"
    sqlite3 "$CORE_DB" <<-'EOF'
SELECT output_text FROM mindflow WHERE prompt_hash = '$prompt_hash' ORDER BY loop_number DESC,ranking_score DESC LIMIT 1;
EOF
}

# FULL CONTEXT BUILDING: Increased context truncation length (300 chars)
build_context(){
    local -n outputs="$1"
    local loop_number="$2"
    local context="Previous loop $loop_number outputs (Full Verbose Context):\n"
    
    for model in "${!outputs[@]}"; do
        local output="${outputs[$model]}"
        local clean_output="${output#[FALLBACK]}"
        # Increased truncation to 300 characters
        context="${context}\n${model^^}: ${clean_output:0:300}..."
    done
    
    echo -e "$context"
}

store_task_log(){
    local task_type="$1"
    local input="$2"
    local output="$3"
    local metadata="$4"
    if [[ ${#output} -gt 2000 ]]; then
        local compressed_hash=$(compress_store "$output")
        output="COMPRESSED:$compressed_hash"
    fi
    sqlite3 "$CORE_DB" <<'EOF'
INSERT INTO task_logs(task_type,task_input,task_output,metadata)
VALUES('$task_type','$(sqlite3_escape "$input")','$(sqlite3_escape "$output")','$(sqlite3_escape "$metadata")');
EOF
}

#--- NEW AI Enhancement Functions (No Change) ---
ai_refine_file(){
    local file="$1"
    if [[ ! -f "$file" ]]; then
        echo "Error: File not found: $file" >&2
        return 1
    fi
    
    local file_content=$(cat "$file")
    local file_type=$(file -b --mime-type "$file")
    local prompt="Analyze the following ${file_type} content from file '$file'. Provide a fully detailed critique focusing on best practices, efficiency, and robustness. Present the suggested, improved code block marked with [FINAL_ANSWER]CODE_START...CODE_END. Original Content:\n\n---\n\n${file_content}"
    
    echo -e "💡 Starting Autonomous Code Refinement on $file (using CORE/CODE agents)..."
    log_event "INFO" "Refining code file: $file"
    
    local result=$(autonomic_reasoning "$prompt")
    
    echo -e "\n========================================"
    echo -e "✅ Refinement Analysis Complete"
    echo -e "========================================"
    
    local suggested_code=$(echo "$result" | sed -n '/\[FINAL_ANSWER\]CODE_START/,/CODE_END/p')
    
    if [[ -n "$suggested_code" ]]; then
        echo -e "\nSuggested Refinement:"
        echo -e "----------------------------------------"
        echo "$suggested_code" | sed -e '1d' -e '$d' -e 's/\[FINAL_ANSWER\]CODE_START//' -e 's/CODE_END//'
    else
        echo -e "\nFull Analysis Output:"
        echo -e "----------------------------------------"
        echo "$result"
    fi
}

ai_synthesize_topic(){
    local topic="$1"
    if [[ -z "$topic" ]]; then
        echo "Error: Please specify a topic for synthesis." >&2
        return 1
    fi

    local prompt="Perform an exhaustive, holistic synthesis on the topic: '$topic'. Ensure the final response is deeply contextual, culturally aware (incorporate a German perspective), and logically robust. Provide the full synthesized report marked with [FINAL_ANSWER]."
    
    echo -e "💡 Starting Contextual Topic Synthesis on '$topic' (using CORE/COIN/2244 agents)..."
    log_event "INFO" "Synthesizing topic: $topic"
    
    local result=$(autonomic_reasoning "$prompt")
    
    echo -e "\n========================================"
    echo -e "✅ Synthesis Report Complete"
    echo -e "========================================"
    
    echo "$result" | sed 's/\[FINAL_ANSWER\]//g'
}

#--- Utility Functions---
ai_editor_file(){
    local file="$1"
    if [[ -z "$file" ]]; then
        echo "Error: Please specify a file to edit." >&2
        return 1
    fi
    if [[ ! -f "$file" ]]; then
        echo "Warning: File '$file' does not exist. Creating it."
    fi

    log_event "INFO" "Opening '$file' with editor..."
    "${EDITOR:-vi}" "$file"
}
download_and_unzip(){
    local url="$1"
    local destination="${2:-./}"
    log_event "INFO" "Downloading: $url"
    local temp_file=$(mktemp)

    if curl -L -s "$url" -o "$temp_file"; then
        if file "$temp_file" | grep -q "Zip archive"; then
            unzip -q "$temp_file" -d "$destination"
            log_event "SUCCESS" "Downloaded and extracted to $destination"
        else
            mv "$temp_file" "$destination"
            log_event "SUCCESS" "Downloaded to "$destination""
        fi
    else
        log_event "ERROR" "Download failed: $url"
        return 1
    fi
}
file_search(){
    local pattern="$1"
    local path="${2:-.}"
    log_event "INFO" "Searching for: $pattern in $path"
    if command -v rg >/dev/null 2>&1; then
        rg --color=always -n "$pattern" "$path"
    else
        grep -r --color=always -n "$pattern" "$path" 2>/dev/null || true
    fi
}
lint_code(){
    local file="$1"
    local linter="${2:-auto}"
    if [[ "$linter" == "auto" ]]; then
        case "$file" in
            *.js|*.ts)linter="eslint";;
            *.py)linter="pylint";;
            *.sh)linter="shellcheck";;
            *)echo "No linter configured for $file" && return 1;;
        esac
    fi
    case "$linter" in
        "eslint")npx eslint "$file";;
        "pylint")pylint "$file";;
        "shellcheck")shellcheck "$file";;
        *)echo "Unknown linter: $linter" && return 1;;
    esac
}

#--- Main CLI Interface (Updated Help) ---
show_help(){
cat <<-'EOF'
Autonomic Intelligence Platform v$VERSION - 5-Agent Assembly (FULL VERBOSITY)
USAGE: 
ai "prompt"                 # Execute the full 5-Agent parallel reasoning pipeline
ai hash < string | file >   # Generate hash of string or file
ai download < url > [dest]  # Download and extract file
ai search < pattern > [path]# Search files with regex
ai lint < file > [linter]   # Lint code file
ai edit < file >            # Open file for editing (AI-Editor mode)
ai refine < file >          # Autonomous Code Refinement (CORE/CODE Agents)
ai synthesize < topic >     # Contextual Topic Synthesis (CORE/COIN/2244 Agents)
ai logs                     # Show recent activity logs
ai status                   # Show system status
ai --help                   # Show this help

EXAMPLES:
ai "Explain quantum computing in comprehensive, exhaustive detail"
ai refine script.sh
ai synthesize "The cultural impact of decentralization on European identity"
ai edit my_project/config.json

AGENTS (The Assembly) - All agents are configured for maximum verbosity.
EOF
}
show_status(){
    echo "🤖 Autonomic Intelligence Platform Status"
    echo "========================================"
    echo "Version: $VERSION"
    echo "Database: $CORE_DB"
    echo "Swap Directory: $SWAP_DIR"
    echo "Log File: $LOG_FILE"
    
    if curl -s "${OLLAMA_BASE}/api/tags" >/dev/null; then
        echo "OLLAMA: ✅ Connected"
    else
        echo "OLLAMA: ❌ Offline (using fallbacks)"
    fi
    
    local mindflow_count=$(sqlite3 "$CORE_DB" "SELECT COUNT(*) FROM mindflow;" 2>/dev/null || echo "0")
    local task_count=$(sqlite3 "$CORE_DB" "SELECT COUNT(*) FROM task_logs;" 2>/dev/null || echo "0")
    echo "Mindflow Records: $mindflow_count"
    echo "Task Logs: $task_count"
    echo "Active Models: ${#AGENT_MANIFEST[@]}"
}
show_logs(){
    local limit="${1:-10}"
    echo "📋 Recent Activity Logs"
    echo "========================================"
    if [[ -f "$LOG_FILE" ]]; then
        tail -n "$limit" "$LOG_FILE"
    else
        echo "No logs found."
    fi
}

#--- Main Execution (No change) ---
main(){
    if [[ ! -f "$CORE_DB" ]]; then
        init_database
        log_event "SYSTEM" "Database initialized at $CORE_DB"
    fi
    
    cleanup_swap_dir 30
    
    case "${1:-}" in
        "hash")
            if [[ -f "$2" ]]; then
                hash_file "$2"
            else
                hash_string "${2:-}"
            fi;;
        "download")download_and_unzip "$2" "${3:-}";;
        "search")file_search "$2" "${3:-}";;
        "lint")lint_code "$2" "${3:-auto}";;
        "edit")ai_editor_file "$2";;
        "refine")ai_refine_file "$2";;
        "synthesize")ai_synthesize_topic "$2";;
        "logs")show_logs "$2";;
        "status")show_status;;
        "--help"|"-h"|"help")show_help;;
        "")show_help;;
        *)
        autonomic_reasoning "$*";;
    esac
}

check_dependencies(){
    local deps=("sqlite3" "curl" "jq" "gzip" "file" "shellcheck") 
    local missing=()
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" >/dev/null 2>&1; then
            missing+=("$dep")
        fi
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        echo "Missing dependencies: ${missing[*]}" >&2
        echo "Please install them to use the AI platform." >&2
        exit 1
    fi
}

check_dependencies
main "$@"
