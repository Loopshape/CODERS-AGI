import { LogType, ProcessedFile } from '../types';

export const UNIVERSAL_LAW = `:BOF:
redo complete layout and design an advanced symetrics to proximity accordance
for dedicated info-quota alignments, which grant a better adjustment for
leading besides subliminal range compliance promisings, that affair any
competing content relations into a cognitive intuitition guidance comparison
between space and gap implies, that are suggesting the viewer a subcoordinated
experience alongside repetitive tasks and stoic context sortings, all
cooperational aligned to timed subjects of importance accordingly to random
capacity within builds of data statements, that prognose the grid reliability
of a mockup as given optically acknowledged for a more robust but also as
attractive rulership into golden-ratio item handling
:EOF:`;

export const processFiles = async (files: File[], onProgress: (progress: number) => void): Promise<{ outputs: ProcessedFile[]; logs: { type: LogType; message: string; }[] }> => {
    const logs: {type: LogType, message: string}[] = [];
    const outputs: ProcessedFile[] = [];
    const totalFiles = files.length;

    if (totalFiles === 0) {
        logs.push({type: LogType.Warn, message: 'No files selected for processing.'});
        return {
            outputs: [],
            logs,
        };
    }

    for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        
        logs.push({ type: LogType.Info, message: `Processing file: ${file.name}` });
        // Simulate the script's fallback behavior when Ollama is not present
        logs.push({ type: LogType.Warn, message: `Ollama not found, writing universal law instead` });

        outputs.push({
            fileName: `${file.name}.processed`, // The new script adds .processed
            content: UNIVERSAL_LAW,
        });
        
        const progress = Math.round(((i + 1) / totalFiles) * 100);
        onProgress(progress);
        await new Promise(res => setTimeout(res, 50));
    }

    logs.push({ type: LogType.Success, message: 'Batch processing simulation complete.' });

    return {
        outputs,
        logs,
    };
};

export const scanEnvironment = () => {
    const logs = [
        {type: LogType.Info, message: 'Scanning environment...'}
    ];
    const output = `
[Environment Variables]
USER=webapp_user
HOME=/app/home
SHELL=/bin/bash
...

[Disk Usage]
Filesystem      Size  Used Avail Use% Mounted on
overlay          50G   10G   40G  20% /
tmpfs            64M     0   64M   0% /dev
...

[Home Directory]
total 8
drwxr-xr-x 1 webapp_user webapp_user 4096 Jul 29 10:00 .
drwxr-xr-x 1 root        root        4096 Jul 29 09:58 ..
-rw-r--r-- 1 webapp_user webapp_user    0 Jul 29 10:00 .bash_history
`;
    return { output: output.trim(), logs, fileName: 'environment_scan.txt' };
}

export const processPrompt = (prompt: string) => {
    const logs = [
        {type: LogType.Info, message: `Running prompt on Ollama gemma3:1b...`},
        {type: LogType.Warn, message: 'Ollama not found, printing prompt only'},
    ];
    return { output: prompt, logs, fileName: 'prompt_output.txt' };
}

export const processUrlPrompt = (url: string) => {
    const logs = [
        {type: LogType.Info, message: `Simulating fetch for URL: ${url}`},
        {type: LogType.Warn, message: `Note: In-browser fetching is restricted by CORS. This is a simulation.`},
    ];

    const simulatedContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Simulated Content from ${url}</title>
</head>
<body>
    <h1>Content for ${url}</h1>
    <p>This is simulated content fetched from the provided URL.</p>
    <p>The actual script running in a shell environment would download the real content.</p>
</body>
</html>
    `.trim();

    logs.push({type: LogType.Success, message: 'Successfully simulated fetching content.'});

    return { output: simulatedContent, logs, fileName: 'url_content.html' };
};

// --- Git functionality ---
export const gitInit = () => {
    const logs = [
        { type: LogType.Info, message: 'Simulating: git init' },
        { type: LogType.Success, message: 'Initialized empty Git repository in /app/home/.git/' }
    ];
    return { output: 'Initialized empty Git repository in /app/home/.git/', logs, fileName: 'git_init.log' };
};

export const gitAdd = (files: string) => {
    const logs = [
        { type: LogType.Info, message: `Simulating: git add ${files}` },
        { type: LogType.Success, message: 'Changes staged for next commit.' }
    ];
    return { output: `Staged files matching pattern: ${files}`, logs, fileName: 'git_add.log' };
};

export const gitCommit = (message: string) => {
    const commitHash = (Math.random().toString(36) + '00000000000000000').slice(2, 9);
    const logs = [
        { type: LogType.Info, message: `Simulating: git commit -m "${message}"` },
        { type: LogType.Success, message: `[main (root-commit) ${commitHash}] ${message}` }
    ];
    const output = `[main (root-commit) ${commitHash}] ${message}\n 2 files changed, 28 insertions(+)`;
    return { output, logs, fileName: 'git_commit.log' };
};

export const gitPush = (remote: string, branch: string) => {
    const logs = [
        { type: LogType.Info, message: `Simulating: git push ${remote} ${branch}` },
        { type: LogType.Info, message: 'Enumerating objects: 5, done.' },
        { type: LogType.Info, message: 'Writing objects: 100% (3/3), done.' },
        { type: LogType.Success, message: `To github.com:user/repo.git\n * [new branch]      ${branch} -> ${branch}` }
    ];
    const output = `Total 3 (delta 0), reused 0 (delta 0)\nTo https://github.com/example/repo.git\n * [new branch]      ${branch} -> ${branch}`;
    return { output, logs, fileName: 'git_push.log' };
};


const AI_SCRIPT_CONTENT = `#!/usr/bin/env bash
# CODERS-AGI Installer for Termux/Proot (Unrooted)
# Mandatory localhost:8888, tmux auto-restart, auto-browser, auto-start
# Termux-safe: avoids declare -f / embedded function issues

set -euo pipefail
IFS=$'\\n\\t'

log()    { printf '\\033[34m[→] %s\\033[0m\\n' "$*"; }
warn()   { printf '\\033[33m[!] %s\\033[0m\\n' "$*"; }
fail()   { printf '\\033[31m[✗] %s\\033[0m\\n' "$*" >&2; exit 1; }

REPO_URL="https://github.com/Loopshape/CODERS-AGI.git"
REPO_DIR="$HOME/CODERS-AGI"
BIN_DIR="$HOME/bin"
LAUNCHER="$BIN_DIR/coders-agi"
STOPPER="$BIN_DIR/coders-agi-stop"
BASHRC="$HOME/.bashrc"
ENV_FILE="$REPO_DIR/.env.local"
PORT=8888

# --- Ensure bin dir exists and PATH is set
mkdir -p "$BIN_DIR"
if ! echo "$PATH" | grep -q "$BIN_DIR"; then
  warn "Adding $BIN_DIR to PATH in $BASHRC"
  echo "export PATH=\\$HOME/bin:\\$PATH" >> "$BASHRC"
fi

# --- Install nvm + Node.js if missing
if ! command -v node >/dev/null 2>&1; then
  log "Installing Node.js via nvm..."
  if [ ! -d "$HOME/.nvm" ]; then
    git clone https://github.com/nvm-sh/nvm.git "$HOME/.nvm"
    cd "$HOME/.nvm" && git checkout \`git describe --abbrev=0 --tags\`
  fi
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
  nvm install --lts
  nvm use --lts
else
  log "Node.js already installed: $(node -v)"
fi

# --- Clone or update repo
if [ -d "$REPO_DIR" ]; then
  log "Repo exists. Pulling updates..."
  git -C "$REPO_DIR" pull
else
  log "Cloning CODERS-AGI..."
  git clone "$REPO_URL" "$REPO_DIR"
fi

cd "$REPO_DIR"

# --- Install npm deps
log "Installing dependencies..."
npm install

# --- Configure API key
if [ -z "\${GEMINI_API_KEY:-}" ]; then
  warn "No GEMINI_API_KEY detected. Please add it manually to $ENV_FILE"
  echo "GEMINI_API_KEY=your_api_key_here" > "$ENV_FILE"
else
  log "Setting GEMINI_API_KEY into $ENV_FILE"
  echo "GEMINI_API_KEY=$GEMINI_API_KEY" > "$ENV_FILE"
fi

# --- Helper to write LF-only files
write_lf_file() {
  local path="$1"
  shift
  printf "%s\\n" "$*" | sed 's/\\r$//' > "$path"
  chmod +x "$path"
}

# --- Create Termux-safe launcher
log "Creating launcher at $LAUNCHER"
write_lf_file "$LAUNCHER" '#!/usr/bin/env bash
cd "$HOME/CODERS-AGI"

if [ -f "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  . "$NVM_DIR/nvm.sh"
  nvm use --lts >/dev/null
fi

SESSION="coders-agi"
PORT=8888
VITE_HOST=localhost
VITE_PORT=$PORT
LOG_FILE="/tmp/coders-agi.log"
URL="http://localhost:$PORT"

log()    { printf "\\033[34m[→] %s\\033[0m\\n" "$*"; }
warn()   { printf "\\033[33m[!] %s\\033[0m\\n" "$*"; }

# Start tmux session if missing
if ! tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux new-session -d -s "$SESSION" bash -c "
    export VITE_HOST=$VITE_HOST
    export VITE_PORT=$VITE_PORT
    export LOG_FILE=$LOG_FILE
    echo \\"Starting CODERS-AGI on localhost:$VITE_PORT, logs: $LOG_FILE\\"
    while true; do
      npm run dev >\\"\$LOG_FILE\\" 2>&1
      echo \\"Server exited. Restarting in 3s...\\"
      sleep 3
    done
  "
  # Wait for server and open browser once
  for i in {1..60}; do
    if nc -z localhost $PORT >/dev/null 2>&1; then
      if command -v termux-open-url >/dev/null 2>&1; then
        termux-open-url "$URL"
      fi
      break
    fi
    sleep 1
  done
fi

tmux attach -t "$SESSION"
'

# --- Create stopper script with LF
log "Creating stopper at $STOPPER"
write_lf_file "$STOPPER" '#!/usr/bin/env bash
if command -v tmux >/dev/null 2>&1; then
  if tmux has-session -t coders-agi 2>/dev/null; then
    tmux kill-session -t coders-agi
    echo "CODERS-AGI session stopped."
  else
    echo "No CODERS-AGI session running."
  fi
else
  echo "tmux not installed."
fi'

# --- Auto-start service hook
SERVICE_SNIPPET="# CODERS-AGI auto-start"
if ! grep -q "$SERVICE_SNIPPET" "$BASHRC" 2>/dev/null; then
  cat >> "$BASHRC" <<EOF

$SERVICE_SNIPPET
if command -v tmux >/dev/null 2>&1; then
  if ! tmux has-session -t coders-agi 2>/dev/null; then
    nohup coders-agi >/dev/null 2>&1 &
  fi
fi
EOF
  log "Auto-start service added to $BASHRC"
fi

log "✅ Installation complete!"
echo "Start manually with: coders-agi"
echo "Stop with: coders-agi-stop"
echo "Access on this device only: http://localhost:8888"
`;

export const getInstallScript = () => {
    const logs = [
        {type: LogType.Info, message: 'Generating CODERS-AGI installer script...'},
        {type: LogType.Success, message: 'Save this script, run `chmod +x install.sh`, then `./install.sh`.'},
    ];
    return { output: AI_SCRIPT_CONTENT.trim(), logs, fileName: 'install-coders-agi.sh' };
};
