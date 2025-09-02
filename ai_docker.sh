#!/bin/bash
# ==============================================================================
#      Rootless AGI Core Installer (setup_rootless_agi.sh)
# ==============================================================================
# This script sets up a completely rootless, self-contained AGI web service.
# It requires the user to pre-install system dependencies and manages all
# application logic and processes within the user's home directory.
#
# USAGE: ./setup_rootless_agi.sh (Run as a normal, non-root user)
# ==============================================================================

# --- Strict Mode & Configuration ---
set -euo pipefail
PROJECT_DIR="rootless-agi-core"
MODEL_NAME="gemma:2b"

# --- Helper Functions ---
log_info() { echo -e "\e[34m[*] $1\e[0m"; }
log_success() { echo -e "\e[32m[+] $1\e[0m"; }
log_warn() { echo -e "\e[33m[!] $1\e[0m"; }
die() { echo -e "\e[31m[-] FATAL: $1\e[0m"; exit 1; }

# --- Main Installer Logic ---
log_info "Starting Rootless AGI Core setup..."

# 1. Root Check - ABORT if running as root
if [ "$(id -u)" -eq 0 ]; then
    die "This script must be run as a non-root user."
fi

# 2. Dependency Checks (No Installation)
log_info "Checking for required system dependencies..."
DEPS=("node" "npm" "ollama" "curl")
MISSING_DEPS=()
for CMD in "${DEPS[@]}"; do
    if ! command -v "$CMD" &> /dev/null; then
        MISSING_DEPS+=("$CMD")
    fi
done

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    die "Missing system dependencies. Please install them first (e.g., 'sudo apt install ${MISSING_DEPS[*]}')"
fi
log_success "All system dependencies are present."

# 3. Create Project Structure
log_info "Creating project directory: ${PROJECT_DIR}"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# 4. Initialize Node.js Project and Install LOCAL Dependencies
log_info "Initializing Node.js project and installing local dependencies (including pm2)..."
npm init -y > /dev/null
# Install pm2 locally as a dev dependency, not globally
npm install express axios cheerio dotenv pm2 || die "npm install failed."
log_success "Node.js dependencies installed locally."

# 5. Generate the main server.js application file
log_info "Generating the Express server code (server.js)..."
cat > "server.js" << 'EOF'
// --- Rootless AGI Core Express Server ---
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; // Non-privileged port
const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MODEL = process.env.MODEL_NAME || 'gemma:2b';

app.use(express.json());

async function runAiPrompt(prompt) {
    const response = await axios.post(OLLAMA_API_URL, { model: MODEL, prompt, stream: false });
    return response.data.response;
}

app.get('/', (req, res) => res.send('Rootless AGI Core Server is running.'));

app.post('/api/prompt', async (req, res) => {
    try {
        const result = await runAiPrompt(req.body.prompt);
        res.json({ response: result });
    } catch (e) { res.status(503).json({ error: `Ollama service error: ${e.message}` }); }
});

app.post('/api/url', async (req, res) => {
    try {
        const { data: html } = await axios.get(req.body.url);
        const $ = cheerio.load(html);
        $('script, style').remove();
        const cleanText = $('body').text().replace(/\s\s+/g, ' ').trim();
        const systemPrompt = `Analyze content from '${req.body.url}'. Summarize: Main Topic, Key Themes, Sentiment.\n\n---\n${cleanText}`;
        const result = await runAiPrompt(systemPrompt);
        res.json({ source: req.body.url, response: result });
    } catch (e) { res.status(500).json({ error: `Failed to process URL: ${e.message}` }); }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rootless AGI server listening on http://0.0.0.0:${PORT}`);
});
EOF
log_success "server.js created."

# 6. Generate PM2 Ecosystem File
log_info "Generating PM2 ecosystem file..."
# This config is now simpler as it only manages one process
cat > "ecosystem.config.js" << EOF
module.exports = {
  apps : [{
    name   : "rootless-agi-server",
    script : "server.js",
    watch  : false,
    env    : {
      "NODE_ENV": "production",
      "MODEL_NAME": "${MODEL_NAME}"
    }
  }]
}
EOF
log_success "ecosystem.config.js created."

# 7. Generate Helper Scripts for Service Management
log_info "Generating helper scripts (start.sh, stop.sh, logs.sh)..."
# Use the locally installed pm2 binary
PM2_CMD="./node_modules/.bin/pm2"

cat > "start.sh" << EOF
#!/bin/bash
# Starts the AGI server using the local PM2 instance.
echo "[*] Checking if Ollama service is running..."
if ! curl -s --head http://localhost:11434 >/dev/null; then
    echo "[!] Ollama is not running. Please start it in another terminal with: ollama serve"
    exit 1
fi
echo "[*] Starting the Rootless AGI server with PM2..."
${PM2_CMD} start ecosystem.config.js
EOF

cat > "stop.sh" << EOF
#!/bin/bash
# Stops the AGI server using the local PM2 instance.
echo "[*] Stopping the Rootless AGI server..."
${PM2_CMD} stop rootless-agi-server
EOF

cat > "logs.sh" << EOF
#!/bin/bash
# Tails the logs for the AGI server.
echo "[*] Tailing logs for the AGI server... (Press Ctrl+C to exit)"
${PM2_CMD} logs rootless-agi-server
EOF

chmod +x start.sh stop.sh logs.sh
log_success "Service management scripts created."

# --- Final Instructions ---
echo
log_info "========================================================="
log_info "  Rootless AGI Core Setup Complete"
log_info "========================================================="
echo
log_warn "ACTION REQUIRED: Ensure your Ollama service is running."
log_warn "You can start it in another terminal with: ollama serve"
echo
log_info "To manage your new AGI server, use the scripts inside the '${PROJECT_DIR}' directory:"
log_success "  cd ${PROJECT_DIR}"
log_success "  ./start.sh    # To start the server"
log_success "  ./stop.sh     # To stop the server"
log_success "  ./logs.sh     # To view live logs"
echo
log_info "The server will be accessible at http://localhost:3000"
echo
