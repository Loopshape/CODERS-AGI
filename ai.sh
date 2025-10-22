#!/usr/bin/env bash
# ai.sh - AI Autonomic Synthesis Platform v35 (Cyberspace Cognition Edition)
# A multi-frontend polyglot agent hosting a complex 3D Word Bubble simulation.

set -euo pipefail
IFS=$'\n\t'

# --- RUNTIME MODE DETECTION: EMBEDDED NODE.JS WEB SERVER ---
if [[ "${1:-}" == "serve" ]]; then
    exec node --input-type=module - "$0" "$@" <<'NODE_EOF'
import http from 'http';
import { exec } from 'child_process';
const PORT = process.env.AI_PORT || 8080;
const AI_SCRIPT_PATH = process.argv[2];
const HTML_UI = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>AGENT NEMODIAN :: CYBERSPACE COCKPIT v35.0</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
<style>
html,body { margin:0; padding:0; overflow:hidden; background:black; height:100%; }
canvas { display:block; }
#verboseOverlay{
  position:absolute; bottom:0; left:0; width:100%; max-height:200px;
  overflow-y:auto; background:rgba(0,0,0,0.6); color:#0f0; padding:5px;
  font-size:12px; box-sizing:border-box; font-family:'JetBrains Mono', monospace; z-index:10;
}
#commandBar{
  position:absolute; top:10px; left:10px; width:400px; padding:10px;
  background:rgba(0,0,0,0.8); border:1px solid #66d9ef; border-radius:5px;
  box-shadow: 0 0 10px #66d9ef; z-index:20;
}
#commandInput{
  width:100%; padding:5px; background:none; border:1px solid #f92672; color:#a6e22e; outline:none;
}
.cli-prompt { color: #a6e22e; font-weight: bold; }
.cli-output { color: #66d9ef; }
</style>
</head>
<body>
<canvas id="wordCanvas"></canvas>
<div id="commandBar">
    <div style="color:#a6e22e; font-weight:bold; margin-bottom:5px;">SYNTHESIS CONSOLE</div>
    <input type="text" id="commandInput" placeholder="Enter prompt or command..." />
</div>
<div id="verboseOverlay"></div>
<script>
const canvas=document.getElementById('wordCanvas');
const ctx=canvas.getContext('2d');
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;
const cx=canvas.width/2, cy=canvas.height/2;
const verboseOverlay=document.getElementById('verboseOverlay');
const commandInput=document.getElementById('commandInput');

// ---------------- Agent Class (Client-Side Simulation/Visualization Logic) ----------------
class Agent {
  constructor(id){
    this.id=id;
    this.pool=[];
    this.memory=[];
  }
  spawnToken(word, meta){
    let token={
      id:'T'+Math.floor(Math.random()*10000),
      word:word,
      semantic:[word],
      metaTopic:meta,
      orbit:150+50*(5-meta), 
      angle:Math.random()*Math.PI*2,
      speed:0.002+Math.random()*0.003,
      lift:0,
      brightness:1,
      x:0,y:0,z:0,
      active:true,
      history:[]
    };
    this.pool.push(token);
    this.log('spawn',token);
    return token;
  }
  fuseTokens(tokenA,tokenB){
    if(!tokenA.active||!tokenB.active) return null;
    let newMeta = Math.max(tokenA.metaTopic, tokenB.metaTopic);
    let newToken={
      id:'F'+Math.floor(Math.random()*10000),
      word:tokenA.word+'-'+tokenB.word,
      semantic:[...new Set([...tokenA.semantic,...tokenB.semantic])],
      metaTopic:newMeta,
      orbit:150+50*(5-newMeta),
      angle:(tokenA.angle+tokenB.angle)/2,
      speed:(tokenA.speed+tokenB.speed)/2,
      lift:0,
      brightness:1.5,
      x:0,y:0,z:0,
      active:true,
      history:[...tokenA.history,...tokenB.history,`Fusion by Agent ${this.id}`]
    };
    tokenA.active=tokenB.active=false;
    this.pool.push(newToken);
    this.log('fusion',tokenA,tokenB);
    return newToken;
  }
  neuroPulse(source="self"){
    this.pool.forEach(t=>{if(t.active) t.brightness=1.5;});
    this.log('pulse',null,source);
  }
  log(action, token=null, other=null){
      let sentence="";
      switch(action){
        case "spawn": sentence=`Agent ${this.id} spawns "${token.word}" [meta ${token.metaTopic}].`; break;
        case "fusion": sentence=`Agent ${this.id} fused "${token.word}" with "${other.word}" → new token.`; break;
        case "pulse": sentence=`Agent ${this.id} pulses active tokens (Source: ${token}).`; break;
        case "backend": sentence=`[BACKEND: ${token}] ${other}`; break;
      }
      this.memory.push({sentence,timestamp:Date.now()});
      if(this.memory.length>100) this.memory.shift();
      const vline=document.createElement('div'); vline.textContent=sentence;
      verboseOverlay.appendChild(vline);
      verboseOverlay.scrollTop=verboseOverlay.scrollHeight;
  }
}

// ---------------- Backend Bridge & UI Logic ----------------
const AGENTS=[new Agent(0),new Agent(1)];
const WORD_LIST=["Entropy","Dream","Fusion","Vision","Energy","Neuro","Token","Pulse","Cosmos","Logic","Ollama","Model","Core","Plan","Execute"];
AGENTS.forEach(agent=>WORD_LIST.forEach(w=>agent.spawnToken(w,1+Math.floor(Math.random()*5))));

async function executeBackendCommand(cmd) {
    if (!cmd.startsWith('ai ')) cmd = 'ai ' + cmd;
    
    // Simulate neuro-pulse on execution
    AGENTS.forEach(a => a.neuroPulse("ExecutionTrigger"));

    // Log the user command
    const promptLine = document.createElement('div');
    promptLine.innerHTML = `<span class="cli-prompt">CYBER></span> <span class="cli-input">${cmd}</span>`;
    verboseOverlay.appendChild(promptLine);
    verboseOverlay.scrollTop = verboseOverlay.scrollHeight;

    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.textContent = 'THINKING...';
    loadingIndicator.classList.remove('hidden');

    try {
        const response = await fetch('/api/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: cmd })
        });
        const result = await response.json();
        
        AGENTS.forEach(a => a.neuroPulse("CompletionSignal"));

        const output = result.output.replace(/\\u001b\\[[0-9;]*m/g, ''); // Clean ANSI codes
        
        output.split('\n').forEach(line => {
             let color = '#66d9ef'; // Default Cyan
             if (line.startsWith('✅')) color = '#a6e22e';
             else if (line.startsWith('❌')) color = '#f92672';
             else if (line.startsWith('🚀')) color = '#fd971f';
             else if (line.includes('Final Answer')) color = '#a6e22e';
             else if (line.includes('WARNING') || line.includes('WARN')) color = '#fd971f';

             const logLine = document.createElement('div');
             logLine.textContent = line;
             logLine.style.color = color;
             verboseOverlay.appendChild(logLine);
        });

    } catch (e) {
        AGENTS.forEach(a => a.neuroPulse("ErrorSignal"));
        const errorLine = document.createElement('div');
        errorLine.textContent = `[NETWORK ERROR] ${e.message}`;
        errorLine.style.color = '#f92672';
        verboseOverlay.appendChild(errorLine);
    } finally {
        loadingIndicator.classList.add('hidden');
        verboseOverlay.scrollTop = verboseOverlay.scrollHeight;
    }
}

commandInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        executeBackendCommand(commandInput.value.trim());
        commandInput.value = '';
    }
});


// ---------------- 3D Visualization Loop ----------------
let angleX=0.002, angleY=0.003;
function rotate3D(t){
  let y=t.y*Math.cos(angleX)-t.z*Math.sin(angleX);
  let z=t.y*Math.sin(angleX)+t.z*Math.cos(angleX);
  t.y=y;t.z=z;
  let x=t.x*Math.cos(angleY)+t.z*Math.sin(angleY);
  z=-t.x*Math.sin(angleY)+t.z*Math.cos(angleY);
  t.x=x;t.z=z;
}

function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  AGENTS.forEach(agent=>{
    // Random evolution logic (fusion, spawn)
    if(Math.random()<0.005) {
      let activeTokens = agent.pool.filter(t=>t.active);
      if(activeTokens.length>1){
        let a=activeTokens[Math.floor(Math.random()*activeTokens.length)];
        let b=activeTokens[Math.floor(Math.random()*activeTokens.length)];
        if(a!==b) agent.fuseTokens(a,b);
      }
    }
    if(Math.random()<0.001){
      let word=WORD_LIST[Math.floor(Math.random()*WORD_LIST.length)];
      agent.spawnToken(word,1+Math.floor(Math.random()*5));
    }
    
    agent.pool.forEach(t=>{
      if(!t.active) return;
      
      t.angle+=t.speed;
      t.x=Math.cos(t.angle)*t.orbit;
      t.y=Math.sin(t.angle)*t.orbit;
      t.z=Math.sin(t.angle*0.5)*t.orbit/2;
      rotate3D(t);
      
      // Decay brightness after pulse
      t.brightness = Math.max(1.0, t.brightness - 0.01);

      const scale=500/(500+t.z);
      const x2d=cx+t.x*scale;
      const y2d=cy+t.y*scale;
      const fontSize=16*scale*t.metaTopic * t.brightness;
      
      const red = Math.min(255, 102 + t.metaTopic * 20); // Scale red component
      const green = Math.min(255, 166 + (6 - t.metaTopic) * 15); // Scale green component
      
      ctx.fillStyle=`rgba(\${red}, \${green}, 238, \${0.3+0.7*scale})`;
      ctx.font=`\${fontSize}px monospace`;
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.fillText(t.word,x2d,y2d);
    });
  });
  requestAnimationFrame(animate);
}
animate();

document.addEventListener('DOMContentLoaded', () => {
    // Initial resize call
    window.dispatchEvent(new Event('resize'));
});

window.addEventListener('resize',()=>{
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
  cx=canvas.width/2; cy=canvas.height/2;
});

canvas.addEventListener('mousedown',e=>{
  let dragging=true, lastX=e.clientX, lastY=e.clientY;
  const moveHandler = (e) => {
    let dx=e.clientX-lastX, dy=e.clientY-lastY;
    angleY+=dx*0.0005; angleX+=dy*0.0005;
    lastX=e.clientX; lastY=e.clientY;
  };
  const upHandler = () => {
    dragging=false;
    window.removeEventListener('mousemove', moveHandler);
    window.removeEventListener('mouseup', upHandler);
  };
  window.addEventListener('mousemove', moveHandler);
  window.addEventListener('mouseup', upHandler);
});
</script>
</body>
</html>
`

http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (req.url === '/' && req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(HTML_UI); return; }
    if (req.url === '/api/command' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c.toString());
        req.on('end', () => {
            try {
                const { command } = JSON.parse(body);
                const sanitizedCmd = command.replace(/(["'$`\\])/g, '\\$1');
                exec(`"${AI_SCRIPT_PATH}" "${sanitizedCmd}"`, { timeout: 600000 }, (err, stdout, stderr) => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    if (err) { res.end(JSON.stringify({ success: false, output: `[SERVER ERROR] ${err.message}\n${stderr}` }));
                    } else { res.end(JSON.stringify({ success: true, output: stdout || 'Command executed without output.' })); }
                });
            } catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ success: false, output: 'Invalid JSON request.' })); }
        });
        return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
}).listen(PORT, () => console.log(`🌐 AI Web UI is live at: http://localhost:${PORT}`));
NODE_EOF
fi
# --- END OF NODE.JS SERVER BLOCK ---


# --- BASH AGENT CORE (v35) ---
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
log_think(){ printf "\n${ORANGE}${ICON_THINK} [%s] %s${NC}\n" "$(date '+%T')" "$*" >&2 && log_to_file "THINK" "$*"; }
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
    log_success "Core Database initialized and schema verified."
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
            fi
            sleep 1
        done
        log_success "Ollama server connected and verified."
    fi
}
run_worker_fast(){
    local m="$1" s="$2" p="$3" payload r_json
    ensure_ollama # MANDATORY CHECK before running
    payload=$(jq -nc --arg m "$m" --arg s "$s" --arg p "$p" '{model:$m,system:$s,prompt:$p,stream:false}')
    r_json=$(curl -s --max-time 300 -X POST http://localhost:11434/api/generate -d "$payload")
    if [[ $(echo "$r_json"|jq -r .error//empty) ]]; then echo "API_ERROR: $(echo "$r_json"|jq -r .error)"; else echo "$r_json"|jq -r .response; fi
}
export -f hash_string semantic_hash_prompt store_output_fast retrieve_output_fast get_cached_response add_to_memory_fast sqlite_escape run_worker_fast ensure_ollama confirm_action

# ---------------- DEVOPS TOOLSET ----------------
tool_run_command() { local proj_dir="$1" cmd="$2"; (cd "$proj_dir" && eval "$cmd") 2>&1 || echo "Command failed."; }
tool_write_file() { local proj_dir="$1" f_path="$2" content="$3"; mkdir -p "$(dirname "$proj_dir/$f_path")"; echo -e "$content">"$proj_dir/$f_path"; echo "File '$f_path' written."; }
export -f tool_run_command tool_write_file

# ---------------- AUTONOMOUS WORKFLOW (Triumvirate Logic) ----------------

# AGENT SUB-FUNCTIONS
agi_phase_messenger() {
    local conversation_history="$1"
    local messenger_prompt="You are the Messenger. Analyze the current conversation context and provide a clear, structured summary of the goal and current state."
    local messenger_output; messenger_output=$(run_worker_fast "$MESSENGER_MODEL" "$messenger_prompt" "$conversation_history")
    log_think "Messenger (${MESSENGER_MODEL}) Analysis: ${messenger_output}"
    echo "$messenger_output"
}

agi_phase_planners() {
    local messenger_output="$1"
    local pids=() temp_files=() planner_outputs=()
    for model in "${PLANNER_MODELS[@]}"; do
        local temp_file; temp_file=$(mktemp)
        temp_files+=("$temp_file")
        (
            log_debug "Starting planner: $model"
            local planner_prompt="You are a strategic Planner. Based on the Messenger's analysis, create a concise, step-by-step plan. Propose a single, specific tool to use for the very next step."
            run_worker_fast "$model" "$planner_prompt" "$messenger_output" > "$temp_file"
        ) &
        pids+=($!)
    done
    for pid in "${pids[@]}"; do wait "$pid" || log_warn "A planner model exited with a non-zero status."; done

    local output_summary=""
    for idx in "${!PLANNER_MODELS[@]}"; do
        local model="${PLANNER_MODELS[$idx]}"
        local file="${temp_files[$idx]}"
        local planner_output; planner_output=$(cat "$file")
        planner_outputs+=("$planner_output")
        log_plan "Planner (${model}) Strategy: ${planner_output}"
        output_summary+="\n\n--- Plan from ${model} ---\n${planner_output}"
    done
    rm -f "${temp_files[@]}"
    echo "$output_summary"
}

agi_phase_executor() {
    local messenger_output="$1" planner_output_context="$2"
    local executor_context="You are the Executor. Synthesize the plans from the planners, resolve conflicts, and decide on the single best tool to use. Your output MUST be in the format:
[REASONING] Your synthesis and final decision.
[TOOL] tool_name <arguments>
If the entire task is solved, respond ONLY with: [FINAL_ANSWER] Your final summary.

--- MESSENGER'S ANALYSIS ---
$messenger_output
--- PLANNER STRATEGIES ---
$planner_output_context"
    local final_plan; final_plan=$(run_worker_fast "$EXECUTOR_MODEL" "Executor" "$executor_context")
    log_execute "Executor (${EXECUTOR_MODEL}) Decision: ${final_plan}"
    echo "$final_plan"
}

agi_execute_tool_and_log() {
    local project_dir="$1" final_plan="$2" task_id="$3"
    
    local tool_line; tool_line=$(echo "$final_plan" | grep '\[TOOL\]' | head -n 1)
    [[ -z "$tool_line" ]] && { log_warn "Executor did not choose a tool."; return 1; }

    local clean_tool_cmd; clean_tool_cmd=$(echo "${tool_line#\[TOOL\] }" | sed 's/\r$//')
    local ai_hmac; ai_hmac=$(calculate_hmac "$clean_tool_cmd")
    local verified_hmac; verified_hmac=$(calculate_hmac "$clean_tool_cmd")
    if [[ "$ai_hmac" != "$verified_hmac" ]]; then log_error "HMAC MISMATCH!"; return 2; fi
    log_success "${ICON_SECURE} HMAC signature verified."

    local tool_name; tool_name=$(echo "$clean_tool_cmd" | awk '{print $1}')
    local args_str; args_str=$(echo "$clean_tool_cmd" | cut -d' ' -f2-)
    local tool_args=(); eval "tool_args=(\"${args_str}\")"

    local tool_result="User aborted action."
    if confirm_action "$clean_tool_cmd"; then
        if declare -f "tool_$tool_name" > /dev/null; then
            tool_result=$(tool_"$tool_name" "$project_dir" "${tool_args[@]}") || "Tool failed."
        else
            log_error "AI tried to call an unknown tool: '$tool_name'"; tool_result="Error: Tool '$tool_name' does not exist."
        fi
    fi
    
    sqlite3 "$CORE_DB" "INSERT INTO tool_logs (task_id, tool_name, args, result) VALUES ('$task_id', '$tool_name', '$(sqlite_escape "$args_str")', '$(sqlite_escape "$tool_result")');"
    echo "$tool_result"
}

agi_create_loop_context() {
    local i="$1" messenger_output="$2" planner_output_context="$3" final_plan="$4" tool_result="$5"
    local loop_summary="--- Loop $i Full Context ---
[MESSENGER: ${MESSENGER_MODEL}]
${messenger_output}
[PLANNER OUTPUTS]
${planner_output_context}
[EXECUTOR: ${EXECUTOR_MODEL}]
${final_plan}
[TOOL_RESULT]
${tool_result}"
    echo "$loop_summary"
}


run_agi_workflow() {
    local user_prompt="$*"
    local task_id=$(hash_string "$user_prompt$(date +%s%N)" | cut -c1-16)
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
        
        # 1. Messenger Phase
        local messenger_output; messenger_output=$(agi_phase_messenger "$conversation_history")

        # 2. Planners Phase
        local planner_output_context; planner_output_context=$(agi_phase_planners "$messenger_output")

        # 3. Executor Phase
        local final_plan; final_plan=$(agi_phase_executor "$messenger_output" "$planner_output_context")

        if [[ "$final_plan" == *"[FINAL_ANSWER]"* ]]; then status="SUCCESS"; conversation_history="$final_plan"; break; fi
        
        # 4. Tool Execution Phase
        local tool_result; tool_result=$(agi_execute_tool_and_log "$project_dir" "$final_plan" "$task_id")
        
        if [[ $? -ne 0 ]]; then
             [[ $? -eq 2 ]] && status="HMAC_FAILURE" || status="TOOL_FAILURE"
             break
        fi

        # 5. Context Update
        local loop_context; loop_context=$(agi_create_loop_context "$i" "$messenger_output" "$planner_output_context" "$final_plan" "$tool_result")
        conversation_history="$loop_context"
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
${GREEN}AI Autonomic Synthesis Platform v31.5 (Autoremediation Edition)${NC}
An agent that uses a fixed, multi-layer reasoning pipeline and ensures Ollama connectivity.

${CYAN}USAGE:${NC}
  ai serve                             # Start the interactive web UI
  ai "your high-level goal"            # Run the autonomous AGI workflow
  ai                                   # (No prompt) Scan current directory context
  ai --setup                           # Install/verify dependencies
  ai --help                            # Show this help
EOF
}

main() {
    if [[ "${1:-}" == "serve" ]]; then exit 0; fi
    init_environment; init_db

    if [[ $# -eq 0 ]]; then run_default_init; exit 0; fi
    case "${1:-}" in
        --setup|-s)
            log_info "Installing dependencies (sqlite3, git, curl, nodejs, npm, tree, openssl)..."
            if command -v dpkg &>/dev/null; then
                log_warn "Attempting to remove potentially conflicting 'npm' package for NodeSource compatibility."
                sudo dpkg -r --force-depends npm 2>/dev/null || true
            fi
            
            if command -v apt-get &>/dev/null; then sudo apt-get update && sudo apt-get install -y sqlite3 git curl nodejs npm tree openssl
            else log_warn "Could not determine package manager. Please install dependencies manually."; fi
            log_success "System dependencies installed." ;;
        --help|-h) show_help ;;
        *) run_agi_workflow "$@" ;;
    esac
}

# --- SCRIPT ENTRY POINT ---
if [[ -z "${NODE_ENV:-}" ]]; then
    main "$@"
fi
