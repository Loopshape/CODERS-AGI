#!/bin/bash

# ==============================================================================
# AI/AGI/AIM Unified Tool - Auto Installer
#
# This script installs the 'ai' command-line tool, sets up its configuration,
# and updates the shell PATH for immediate use.
#
# Usage:
#   bash install.sh
# ==============================================================================

# --- Configuration ---
INSTALL_DIR="$HOME/bin"
CONFIG_DIR="$HOME/.config/ai-tool"
TOOL_NAME="ai"
CONFIG_FILE="$CONFIG_DIR/config.env"
TOOL_PATH="$INSTALL_DIR/$TOOL_NAME"

# --- Colors for better output ---
C_RESET='\033[0m'
C_RED='\033[0;31m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_BLUE='\033[0;34m'
C_CYAN='\033[0;36m'

# --- Helper Functions ---
info() {
    echo -e "${C_BLUE}[INFO]${C_RESET} ${1}"
}

success() {
    echo -e "${C_GREEN}[SUCCESS]${C_RESET} ${1}"
}

warn() {
    echo -e "${C_YELLOW}[WARN]${C_RESET} ${1}"
}

error() {
    echo -e "${C_RED}[ERROR]${C_RESET} ${1}" >&2
    exit 1
}

# --- Bundled 'ai' Tool Script (to be installed) ---
# Using a quoted heredoc to prevent variable expansion during installer execution.
read -r -d '' AI_TOOL_SCRIPT <<'EOF'
#!/bin/bash

# AI/AGI/AIM Unified Processing Tool
# A command-line interface for file processing and environment interaction via a local Ollama model.

# --- Load configuration ---
CONFIG_FILE="$HOME/.config/ai-tool/config.env"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# --- Defaults ---
OLLAMA_API_URL="${OLLAMA_API_URL:-http://127.0.0.1:11434/api/generate}"
OLLAMA_MODEL="${OLLAMA_MODEL:-gemma:2b}" # Default to a common, smaller model

# --- Helper Functions ---
show_help() {
    echo "AI/AGI/AIM Unified Processing Tool"
    echo "Usage: ai [command] [options]"
    echo
    echo "Commands:"
    echo "  scan                Scan the system environment and produce a report."
    echo "  enhance [file]      Enhance a file using the local AI model."
    echo "  review [file]       Perform a code review on a file using the AI model."
    echo "  prompt \"<text>\"   Send a direct text prompt to the AI model."
    echo "  git [clone|pull|push] [url]"
    echo "                      Perform a git operation (simulated)."
    echo "  config              Open the configuration file for editing."
    echo "  help                Show this help message."
    echo
}

call_ollama() {
    local prompt_text=$1
    local is_json_format=${2:-false}

    if ! command -v jq &> /dev/null; then
        echo "Error: 'jq' is not installed. Please install it to process AI responses." >&2
        return 1
    fi

    local format_option=""
    if [ "$is_json_format" = true ]; then
        format_option=', "format": "json"'
    fi

    # Construct the JSON payload
    local json_payload
    json_payload=$(printf '{"model": "%s", "prompt": %s, "stream": false %s}' \
        "$OLLAMA_MODEL" \
        "$(jq -Rs . <<< "$prompt_text")" \
        "$format_option")

    # Make the API call and extract the 'response' field
    curl -s "$OLLAMA_API_URL" -d "$json_payload" | jq -r '.response'
}

# --- Main Logic ---
main() {
    if [ "$#" -eq 0 ]; then
        show_help
        exit 1
    fi

    COMMAND=$1
    shift

    case $COMMAND in
        scan)
            echo "## Environment Scan Report"
            echo "Date: $(date)"
            echo "---"
            echo "### System Variables"
            env | grep -E '^(USER|HOME|SHELL|PWD)='
            echo "---"
            echo "### Disk Usage"
            df -h / | tail -n 1
            echo "---"
            echo "### Directory Listing (~)"
            ls -lA ~ | head -n 10
            ;;
        enhance)
            if [ -z "$1" ]; then echo "Error: Please provide a file to enhance." >&2; exit 1; fi
            local file_content
            file_content=$(cat "$1")
            local prompt="Enhance and refactor the following code, applying modern best practices. Return only the raw code.\n\n---\n\n$file_content"
            call_ollama "$prompt"
            ;;
        review)
            if [ -z "$1" ]; then echo "Error: Please provide a file to review." >&2; exit 1; fi
            local file_content
            file_content=$(cat "$1")
            local prompt="Review the following code for bugs, vulnerabilities, and performance issues. Provide a summary and a list of suggestions in markdown format.\n\n---\n\n$file_content"
            call_ollama "$prompt"
            ;;
        prompt)
            if [ -z "$1" ]; then echo "Error: Please provide a prompt string." >&2; exit 1; fi
            call_ollama "$1"
            ;;
        git)
            echo "Simulating git operation: $@"
            # In a real script, you would execute git commands here.
            ;;
        config)
            if [ -n "$EDITOR" ]; then
                "$EDITOR" "$CONFIG_FILE"
            else
                # Fallback for when $EDITOR is not set
                echo "The EDITOR environment variable is not set. Please open this file manually:"
                echo "$CONFIG_FILE"
            fi
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo "Error: Unknown command '$COMMAND'"
            show_help
            exit 1
            ;;
    esac
}

# Execute main function with all provided arguments
main "$@"
EOF

# --- Bundled Default Config File ---
read -r -d '' DEFAULT_CONFIG_CONTENT <<'EOF'
# AI Tool Configuration
#
# Set the default Ollama model to use.
# Find available models by running 'ollama list'.
OLLAMA_MODEL="gemma:2b"

# Your name and email for git operations, etc.
USER_NAME="Anonymous Coder"
USER_EMAIL="user@example.com"

# The editor to use when running 'ai config'
# export EDITOR="code" # for VS Code
# export EDITOR="vim"  # for Vim
EOF

# --- Installation Logic ---
install() {
    info "Starting AI/AGI/AIM Tool installation..."
    sleep 1

    # 1. Check dependencies
    info "Checking for required dependencies..."
    if ! command -v curl &> /dev/null; then
        error "'curl' is required but not found. Please install it first."
    fi
    if ! command -v git &> /dev/null; then
        warn "'git' could not be found. Some features will be unavailable."
    fi
    if ! command -v ollama &> /dev/null; then
        warn "'ollama' command not found. Please ensure Ollama is installed and running."
        warn "You can download it from https://ollama.com"
    fi
    success "Dependencies check passed."
    sleep 1

    # 2. Create directories
    info "Setting up installation directories..."
    mkdir -p "$INSTALL_DIR" || error "Failed to create installation directory at $INSTALL_DIR."
    mkdir -p "$CONFIG_DIR" || error "Failed to create configuration directory at $CONFIG_DIR."
    success "Directories are ready."
    sleep 1

    # 3. Write the main script
    info "Installing the '${TOOL_NAME}' command to ${C_CYAN}${TOOL_PATH}${C_RESET}..."
    echo -e "$AI_TOOL_SCRIPT" > "$TOOL_PATH"
    chmod +x "$TOOL_PATH" || error "Failed to make the script executable."
    success "The '${TOOL_NAME}' command has been installed."
    sleep 1

    # 4. Write the default config if it doesn't exist
    if [ ! -f "$CONFIG_FILE" ]; then
        info "Creating default configuration file at ${C_CYAN}${CONFIG_FILE}${C_RESET}..."
        echo -e "$DEFAULT_CONFIG_CONTENT" > "$CONFIG_FILE"
        success "Default config created."
    else
        info "Configuration file already exists. Skipping creation."
    fi
    sleep 1

    # 5. Update PATH if necessary
    info "Checking if '${INSTALL_DIR}' is in your shell PATH..."
    local shell_profile=""
    if [[ "$SHELL" == *"zsh"* ]]; then
        shell_profile="$HOME/.zshrc"
    elif [[ "$SHELL" == *"bash"* ]]; then
        shell_profile="$HOME/.bashrc"
    else
        shell_profile="$HOME/.profile" # Fallback for other shells
    fi

    local path_string="export PATH=\"\$PATH:${INSTALL_DIR}\""
    if ! grep -q "PATH.*${INSTALL_DIR}" "$shell_profile" 2>/dev/null; then
        info "Adding '${INSTALL_DIR}' to PATH in ${C_CYAN}${shell_profile}${C_RESET}..."
        echo "" >> "$shell_profile"
        echo "# Add AI/AGI/AIM Tool to PATH" >> "$shell_profile"
        echo "$path_string" >> "$shell_profile"
        success "PATH updated."
        warn "You must restart your terminal or run '${C_YELLOW}source ${shell_profile}${C_RESET}' to use the '${TOOL_NAME}' command."
    else
        success "'${INSTALL_DIR}' is already in your PATH."
    fi

    echo
    echo -e "${C_GREEN}===========================================${C_RESET}"
    success "      Installation Complete!"
    echo -e "${C_GREEN}===========================================${C_RESET}"
    echo
    info "You can now run the '${C_CYAN}${TOOL_NAME}${C_RESET}' command from a new terminal."
    info "Try running '${C_CYAN}ai help${C_RESET}' to see available commands."
    info "Customize your settings in '${C_CYAN}${CONFIG_FILE}${C_RESET}'."
    echo
}

# --- Execute the installer ---
install
