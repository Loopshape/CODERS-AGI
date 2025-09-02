#!/bin/bash
# ==============================================================================
#      CODERS-AGI Deployment Script (setup_coders_agi.sh)
# ==============================================================================
# This script performs a rootless deployment of the CODERS-AGI server from its
# official GitHub repository. It sets up a self-contained Node.js project,
# installs dependencies, and creates helper scripts to manage the service
# with a local PM2 instance.
#
# USAGE: ./setup_coders_agi.sh (Run as a normal, non-root user)
# ==============================================================================

# --- Strict Mode & Configuration ---
set -euo pipefail
REPO_URL="https://github.com/Loopshape/CODERS-AGI.git"
PROJECT_DIR="/home/loop/.coders-agi" # This should match the repo name
MODEL_NAME="gemma:2b"

# --- Helper Functions ---
log_info() { echo -e "\e[34m[*] $1\e[0m"; }
log_success() { echo -e "\e[32m[+] $1\e[0m"; }
log_warn() { echo -e "\e[33m[!] $1\e[0m"; }
die() { echo -e "\e[31m[-] FATAL: $1\e[0m"; exit 1; }

# --- Main Installer Logic ---
log_info "Starting CODERS-AGI Rootless Deployment..."

# 1. Root Check - ABORT if running as root
if [ "$(id -u)" -eq 0 ]; then
    die "This script must be run as a non-root user."
fi

# 2. Dependency Checks (No Installation)
log_info "Checking for required system dependencies..."
DEPS=("git" "node" "npm" "ollama" "curl")
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

# 3. Clone or Update the Repository
if [ -d "$PROJECT_DIR" ]; then
    log_warn "Project directory '${PROJECT_DIR}' already exists."
    read -p "Do you want to pull the latest changes from the repository? (y/N) " -n 1 -r REPLY
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Pulling latest changes..."
        cd "$PROJECT_DIR"
        git pull || die "Failed to pull changes. Please resolve any conflicts and try again."
        cd ..
    fi
else
    log_info "Cloning repository from ${REPO_URL}..."
    git clone "$REPO_URL" || die "Failed to clone the repository."
fi

# 4. Install Project Dependencies
log_info "Entering project directory and installing Node.js dependencies..."
cd "$PROJECT_DIR"
# This will install express, pm2, etc., based on the repo's package.json
npm install || die "npm install failed. Check for errors."
log_success "Node.js dependencies installed locally."

# 5. Create Default Configuration
log_info "Checking for local configuration..."
if [ ! -f ".env" ]; then
    log_warn "No .env file found. Creating a default configuration."
    # Create the .env file with the default model
    echo "MODEL_NAME=${MODEL_NAME}" > .env
    echo "PORT=3000" >> .env
    log_success "Default .env file created."
else
    log_success ".env file already exists."
fi

# 6. Generate Helper Scripts for Service Management
log_info "Generating helper scripts (start.sh, stop.sh, logs.sh)..."
# Use the locally installed pm2 binary from node_modules
PM2_CMD="./node_modules/.bin/pm2"

cat > "start.sh" << EOF
#!/bin/bash
# Starts the AGI server using the local PM2 instance.
echo "[*] Checking if Ollama service is running..."
if ! curl -s --head http://localhost:11434 >/dev/null; then
    echo "[!] Ollama is not running. Please start it in another terminal with: ollama serve"
    exit 1
fi
echo "[*] Starting the CODERS-AGI server with PM2..."
# Assuming the main script is server.js and ecosystem file exists in repo
# If not, PM2 can start the script directly
if [ -f "ecosystem.config.js" ]; then
    \${PM2_CMD} start ecosystem.config.js
else
    \${PM2_CMD} start server.js --name "coders-agi-server"
fi
EOF

cat > "stop.sh" << EOF
#!/bin/bash
# Stops the AGI server using the local PM2 instance.
echo "[*] Stopping the CODERS-AGI server..."
\${PM2_CMD} delete all || true # Stop and delete all managed processes
EOF

cat > "logs.sh" << EOF
#!/bin/bash
# Tails the logs for the AGI server.
echo "[*] Tailing logs for the AGI server... (Press Ctrl+C to exit)"
\${PM2_CMD} logs --raw
EOF

chmod +x start.sh stop.sh logs.sh
log_success "Service management scripts created."

# --- Final Instructions ---
echo
log_info "========================================================="
log_info "  CODERS-AGI Rootless Deployment Complete"
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
log_info "The server will be accessible at http://localhost:3000 (or the port set in .env)"
echo
