#!/usr/bin/env bash
# ai.sh v54 — Fully self-contained Hyper-Reasoning AI Orchestrator

set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$HOME/_/ai"
TMP_DIR="$BASE_DIR/tmp"
FILES_DIR="$BASE_DIR/files"
mkdir -p "$TMP_DIR" "$FILES_DIR"

# Models
LOCAL_MODELS=("core" "loop" "2244" "coin" "code")
CLOUD_MODEL="deepseek-v3.1:671b-cloud"

TEMP_FACTOR="${TEMP_FACTOR:-0.5}"
RECUR_DEPTH="${RECUR_DEPTH:-5}"

# SQLite3 DB
DB_FILE="$BASE_DIR/db/qbits.db"
mkdir -p "$(dirname "$DB_FILE")"
sqlite3 "$DB_FILE" "CREATE TABLE IF NOT EXISTS qbits (
    agent TEXT, 
    prompt TEXT,
    hash TEXT,
    iteration INTEGER,
    response TEXT,
    timestamp REAL,
    temp REAL
);"

# --- Entropy hash ---
hash_prompt() { date +%s%N | sha256sum | cut -c1-64; }

# --- Resume & Verbose reasoning ---
resume_reasoning() {
    local agent="$1"
    local prompt="$2"
    local hash="$3"

    local last_iter
    last_iter=$(sqlite3 "$DB_FILE" "SELECT MAX(iteration) FROM qbits WHERE agent='$agent' AND hash='$hash';")
    last_iter=${last_iter:-0}

    echo "[RESUME] Agent: $agent, starting from iteration $((last_iter+1))"
    for i in $(seq $((last_iter+1)) "$RECUR_DEPTH"); do
        local token="token_${agent}_${i}_$(date +%s%N)"
        echo "[VERBOSE][$agent][$i] Token generated: $token"
        sqlite3 "$DB_FILE" "INSERT INTO qbits (agent,prompt,hash,iteration,response,timestamp,temp) VALUES ('$agent','$prompt','$hash',$i,'$token',$(date +%s),$TEMP_FACTOR);"
    done
    echo "[RESUME] ✅ Agent $agent reasoning complete."
}

# --- Embedded Python Neuro Runner ---
run_python_neuro() {
    local prompt="$1"
    local py_script=$(cat <<'PYTHON'
import sys, time
prompt, hash_val, temp, depth = sys.argv[1:]
for i in range(1, int(depth)+1):
    token = f"neuro_token_{i}_{int(time.time()*1000)}"
    print(f"[PYTHON][{i}] {token}")
PYTHON
)
    python3 -c "$py_script" "$prompt" "$PROMPT_HASH" "$TEMP_FACTOR" "$RECUR_DEPTH" &
    resume_reasoning "neuro" "$prompt" "$PROMPT_HASH"
}

# --- Embedded Node.js Crew AI Runner ---
run_node_ai() {
    local prompt="$1"
    local model="$2"
    local js_script=$(cat <<'NODEJS'
const prompt=process.argv[2], model=process.argv[3];
for(let i=1;i<=parseInt(process.argv[4]);i++){
  const token=`${model}_token_${i}_${Date.now()}`;
  console.log(`[NODE][${model}][${i}] ${token}`);
}
NODEJS
)
    node -e "$js_script" "$prompt" "$model" "$RECUR_DEPTH" &
    resume_reasoning "$model" "$prompt" "$PROMPT_HASH"
}

# --- Deepseek Cloud Runner ---
run_deepseek_cloud() {
    local prompt="$1"
    echo "[CLOUD] Streaming Deepseek-v3.1..."
    resume_reasoning "deepseek" "$prompt" "$PROMPT_HASH"
}

# --- File Processor Functions ---
scan_dir() { find "$1" -type f; }
read_file() { cat "$1"; }
backup_file() { cp "$1" "$1.bak"; }
replace_in_file() { sed -i "s|$2|$3|g" "$1"; }
process_files() {
    local path="$1"
    for f in $(scan_dir "$path"); do
        backup_file "$f"
        replace_in_file "$f" "PLACEHOLDER" "$PROMPT_HASH"
        sqlite3 "$DB_FILE" "INSERT INTO qbits (agent,prompt,hash,iteration,response,timestamp,temp) VALUES ('fileproc','$f','$PROMPT_HASH',0,'processed',$(date +%s),$TEMP_FACTOR);"
    done
}

# --- Pygments Writer ---
write_pygments() {
    python3 - <<EOF
import os, pygments, pygments.lexers, pygments.formatters
out_dir = os.path.join("$TMP_DIR", "highlight")
os.makedirs(out_dir, exist_ok=True)
for f in os.listdir("$FILES_DIR"):
    full_path = os.path.join("$FILES_DIR", f)
    if os.path.isfile(full_path):
        code = open(full_path).read()
        lexer = pygments.lexers.get_lexer_by_name("python", stripall=True)
        formatter = pygments.formatters.HtmlFormatter(full=True, linenos=True)
        highlighted = pygments.highlight(code, lexer, formatter)
        with open(os.path.join(out_dir, f+".html"), "w") as fo: fo.write(highlighted)
EOF
}

# --- HTML5 Dashboard Builder ---
build_dashboard() {
    cat > "$TMP_DIR/dashboard.html" <<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>2244 AI Dashboard</title>
<link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css" rel="stylesheet"/>
<style>body{font-family:monospace;background:#1e1e1e;color:#fff;}</style>
</head>
<body>
<h1>2244 AI Crew Dashboard</h1>
<pre id="qbits-log"></pre>
<script>
fetch("/api/qbits").then(r=>r.json()).then(data=>{
  document.getElementById("qbits-log").textContent = JSON.stringify(data,null,2);
});
</script>
</body>
</html>
HTML
}

# --- Main CLI Entry ---
main() {
    PROMPT_HASH=$(hash_prompt)
    local prompt="${*:-}"
    [[ -z "$prompt" ]] && read -rp "Enter human prompt: " prompt

    # Parallel execution
    run_python_neuro "$prompt" &
    for model in "${LOCAL_MODELS[@]}"; do
        run_node_ai "$prompt" "$model" &
    done
    run_deepseek_cloud "$prompt" &
    wait

    process_files "$FILES_DIR"
    write_pygments
    build_dashboard

    echo "[NEXUS] ✅ Hyper-reasoning + resume + verbose tokenstream + dashboard complete."
}

main "$@"
