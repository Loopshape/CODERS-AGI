#!/bin/bash
# ai_host.sh — single-host cockpit + bridge

BASE="$HOME/_"
AI="$BASE/ai"
TMP="$AI/tmp"
DB="$BASE/db/qbits.db"
HTML="$TMP/crew_cockpit.html"

mkdir -p "$TMP" "$(dirname "$DB")"

# Prompt input
read -p "Enter human prompt: " PROMPT
if [[ -z "$PROMPT" ]]; then
    echo "[Cockpit] ⚠ Prompt empty!"
    exit 1
fi

# Entropy hash
HASH=$(echo -n "$PROMPT$(date +%s%N)" | sha256sum | awk '{print $1}')
echo "[NEXUS] ⚙️ AI Vector initiated: $HASH"

# Launch Python and Node in parallel
python3 "$AI/ai.py" "$PROMPT" "$HASH" "$DB" "$TMP" &
PY_PID=$!
node "$AI/ai.js" "$PROMPT" "$HASH" "$DB" "$TMP" &
JS_PID=$!

# Wait for completion
wait $PY_PID
wait $JS_PID

# Generate HTML dashboard from tmp JSON files
python3 - <<PYHTML
import os, json
TMP_DIR = "$TMP"
HTML_FILE = "$HTML"

json_files = [f for f in os.listdir(TMP_DIR) if f.endswith(".json")]
agents_data = []
for f in json_files:
    with open(os.path.join(TMP_DIR,f)) as jf:
        agents_data.append(json.load(jf))

html_content = f"""
<!DOCTYPE html>
<html lang='en'>
<head>
<meta charset='UTF-8'>
<title>2244 Crew Cockpit</title>
<style>
body {{background:#272822;color:#f8f8f2;font-family:'Fira Code',monospace;}}
header {{padding:15px;text-align:center;}}
pre {{background:#1b1b1b;padding:10px;overflow:auto;}}
</style>
</head>
<body>
<header><h1>2244 Crew Cockpit</h1></header>
<pre id='console'>
"""
for a in agents_data:
    html_content += f"[{a.get('agent','N/A')}] {a.get('output','')}\\n"
html_content += "</pre></body></html>"

with open(HTML_FILE, "w") as f:
    f.write(html_content)
PYHTML

echo "[NEXUS] ✅ Dashboard generated: $HTML"
echo "[NEXUS] Crew logs + SQLite + Neuro stream complete."
