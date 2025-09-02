#!/usr/bin/env bash
# CODERS-AGI Full Automation Installer (Termux/Proot User-Space)
# Runs without sudo/su — installs to ~/bin

set -euo pipefail
IFS=$'\n\t'

log()   { printf '\033[34m[→] %s\033[0m\n' "$*"; }
warn()  { printf '\033[33m[!] %s\033[0m\n' "$*"; }
fail()  { printf '\033[31m[✗] %s\033[0m\n' "$*" >&2; exit 1; }

REPO_URL="git@github.com:Loopshape/CODERS-AGI.git"   # SSH remote
REPO_DIR="$HOME/CODERS-AGI"
BIN_DIR="$HOME/bin"
LAUNCHER="$BIN_DIR/coders-agi"
STOPPER="$BIN_DIR/coders-agi-stop"
BASHRC="$HOME/.bashrc"
ENV_FILE="$REPO_DIR/.env.local"
PORT=8888
HOST=127.0.0.1

mkdir -p "$BIN_DIR"

# --- PATH check
if ! echo "$PATH" | grep -q "$BIN_DIR"; then
  log "Adding $BIN_DIR to PATH in $BASHRC"
  echo "export PATH=\$HOME/bin:\$PATH" >> "$BASHRC"
fi

# --- tmux required
command -v tmux >/dev/null 2>&1 || fail "tmux not found. Install it: pkg install tmux"

# --- nvm + Node.js
if [ ! -d "$HOME/.nvm" ]; then
  log "Installing nvm..."
  git clone https://github.com/nvm-sh/nvm.git "$HOME/.nvm"
  cd "$HOME/.nvm" && git checkout "$(git describe --abbrev=0 --tags)"
fi

# Load nvm
if [ -f "$HOME/.nvm/nvm.sh" ]; then
  (
    set +u
    export NVM_DIR="$HOME/.nvm"
    . "$NVM_DIR/nvm.sh"
    nvm install --lts
    nvm use --lts
  )
fi

# --- Clone or update CODERS-AGI repo
if [ -d "$REPO_DIR/.git" ]; then
  log "Repo exists. Pulling updates..."
  git -C "$REPO_DIR" pull
else
  log "Cloning CODERS-AGI (SSH)..."
  git clone "$REPO_URL" "$REPO_DIR"
fi

cd "$REPO_DIR"

log "Installing npm dependencies..."
npm install

# --- Write .env.local
log "Configuring .env.local"
cat > "$ENV_FILE" <<EOF
VITE_HOST=$HOST
VITE_PORT=$PORT
VITE_DISABLE_HOST_CHECK=true
GEMINI_API_KEY=${GEMINI_API_KEY:-your_api_key_here}
EOF

# --- Helpers
write_lf_file() {
  local path="$1"
  shift
  printf "%s\n" "$*" | sed 's/\r$//' > "$path"
  chmod +x "$path"
}

# --- Launcher
log "Creating launcher at $LAUNCHER"
write_lf_file "$LAUNCHER" "#!/usr/bin/env bash
cd \"$REPO_DIR\"
(
  set +u
  [ -f \"\$HOME/.nvm/nvm.sh\" ] && . \"\$HOME/.nvm/nvm.sh\" && nvm use --lts >/dev/null
)
SESSION=\"coders-agi\"
PORT=$PORT
HOST=$HOST
LOG_FILE=\"/tmp/coders-agi.log\"
URL=\"http://$HOST:$PORT\"
export VITE_HOST=\$HOST VITE_PORT=\$PORT VITE_DISABLE_HOST_CHECK=true
if ! tmux has-session -t \"\$SESSION\" 2>/dev/null; then
  tmux new-session -d -s \"\$SESSION\" bash -c \"
    echo 'Starting CODERS-AGI on \$HOST:\$PORT, logs: \$LOG_FILE'
    while true; do npm run dev >\"\$LOG_FILE\" 2>&1; echo 'Restarting in 3s...'; sleep 3; done
  \"
  for i in {1..60}; do
    if nc -z \$HOST \$PORT >/dev/null 2>&1; then
      command -v termux-open-url >/dev/null 2>&1 && termux-open-url \"\$URL\"
      break
    fi
    sleep 1
  done
fi
tmux attach -t \"\$SESSION\"
"

# --- Stopper
log "Creating stopper at $STOPPER"
write_lf_file "$STOPPER" '#!/usr/bin/env bash
if command -v tmux >/dev/null 2>&1 && tmux has-session -t coders-agi 2>/dev/null; then
  tmux kill-session -t coders-agi
  echo "CODERS-AGI stopped."
else
  echo "No CODERS-AGI session running."
fi'

# --- Auto-start
SERVICE_SNIPPET="# CODERS-AGI auto-start"
if ! grep -q "$SERVICE_SNIPPET" "$BASHRC" 2>/dev/null; then
  cat >> "$BASHRC" <<EOF

$SERVICE_SNIPPET
if command -v tmux >/dev/null 2>&1 && ! tmux has-session -t coders-agi 2>/dev/null; then
  nohup coders-agi >/dev/null 2>&1 &
fi
EOF
  log "Auto-start added to $BASHRC"
fi

log "✅ Installation complete!"
echo "Start: coders-agi"
echo "Stop: coders-agi-stop"
echo "Access: http://127.0.0.1:8888"
