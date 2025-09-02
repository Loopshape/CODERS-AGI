#!/usr/bin/env bash
# Author: Aris Arjuna Noorsanto <exe.opcode@gmail.com>
# AI / AGI / AIM Unified Processing Tool
# Termux / Proot-Distro compatible - All-in-one

set -eu
IFS=$'\n\t'

# -----------------------
# CONFIG
# -----------------------
HOME_ROOT="${HOME:-/data/data/com.termux/files/home}"
BACKUP_DIR="$HOME_ROOT/.ai_backups"
mkdir -p "$BACKUP_DIR"

UNIVERSAL_LAW=$(cat <<'EOF'
:bof:
redo complete layout and design an advanced symetrics to proximity accordance for dedicated info-quota alignments, which grant a better adjustment for leading besides subliminal range compliance promisings, that affair any competing content relations into a cognitive intuitition guidance comparison between space and gap implies, that are suggesting the viewer a subcoordinated experience alongside repetitive tasks and stoic context sortings, all cooperational aligned to timed subjects of importance accordingly to random capacity within builds of data statements, that prognose the grid reliability
of a mockup as given optically acknowledged for a more robust but also as
attractive rulership into golden-ratio item handling
:eof:
EOF
)

OLLAMA_MODEL="gemma3:1b"

# -----------------------
# HELPER LOGGING
# -----------------------
log_info()    { printf '\033[34m[*] %s\033[0m\n' "$*"; }
log_success() { printf '\033[32m[+] %s\033[0m\n' "$*"; }
log_warn()    { printf '\033[33m[!] %s\033[0m\n' "$*"; }
log_error()   { printf '\033[31m[-] %s\033[0m\n' "$*"; }

backup_file() {
    local file="$1"
    if [ -f "$file" ]; then
        local ts
        ts=$(date +%Y%m%d%H%M%S)
        cp "$file" "$BACKUP_DIR/$(basename "$file").$ts.bak"
        log_info "Backup created for $file -> $BACKUP_DIR"
    fi
}

fetch_url() {
    local url="$1"
    if command -v curl >/dev/null 2>&1; then
        curl -sL "$url"
    elif command -v wget >/dev/null 2>&1; then
        wget -qO- "$url"
    else
        log_error "curl or wget required to fetch URLs"
        return 1
    fi
}

get_prompt() {
    local input="$1"
    case "$input" in
        http://*|https://*)
            fetch_url "$input"
            ;;
        *)
            if [ -f "$input" ]; then
                cat "$input"
            else
                echo "$input"
            fi
            ;;
    esac
}

# -----------------------
# BASHRC ADAPTATION
# -----------------------
adapt_bashrc() {
    local bashrc="$HOME_ROOT/.bashrc"
    backup_file "$bashrc"
    log_info "Rewriting .bashrc..."
    cat > "$bashrc" <<EOF
# ~/.bashrc adapted by AI tool
export PATH="\$HOME/bin:\$PATH"
alias ai="\$HOME/bin/ai"
# Add more environment variables or shell customizations here
EOF
    log_success ".bashrc rewritten and environment set"
}

# -----------------------
# AI MODES
# -----------------------
ai_file() {
    for f in "$@"; do
        [ -f "$f" ] || continue
        backup_file "$f"
        log_info "Processing file: $f"
        # AI processing via Ollama
        if command -v ollama >/dev/null 2>&1; then
            pkill ollama || true
            ollama serve &
            sleep 2
            cat "$f" | ollama run "$OLLAMA_MODEL"
        else
            log_warn "Ollama not found, writing universal law instead"
            echo "$UNIVERSAL_LAW" > "$f.processed"
        fi
    done
}

ai_script() {
    log_info "Processing script logic..."
    # Placeholder for AI script-aware processing
}

ai_batch() {
    local pattern="$1"
    shift
    for f in $pattern; do
        [ -f "$f" ] || continue
        backup_file "$f"
        log_info "Batch processing: $f"
        ai_file "$f"
    done
}

ai_env() {
    log_info "Scanning environment..."
    env | sort
    df -h
    ls -la "$HOME_ROOT"
    ls -la /etc
}

ai_pipeline() {
    for f in "$@"; do
        [ -f "$f" ] || continue
        backup_file "$f"
        log_info "Pipeline processing: $f"
        ai_file "$f"
    done
}

# -----------------------
# AGI MODES
# -----------------------
agi_watch() {
    local folder="$1"
    local pattern="${2:-*}"
    log_info "Watching $folder for changes matching $pattern"
    command -v inotifywait >/dev/null 2>&1 || { log_error "Install inotify-tools"; return; }
    inotifywait -m -r -e modify,create,move --format '%w%f' "$folder" | while read file; do
        case "$file" in
            $pattern)
                log_info "Detected change: $file"
                ai_file "$file"
                ;;
        esac
    done
}

agi_screenshot() {
    log_info "Screenshot disabled in Termux/Proot"
}

# -----------------------
# INSTALLER MODE
# -----------------------
install_tool() {
    adapt_bashrc
    mkdir -p "$HOME/bin"
    cp -f "$0" "$HOME/bin/ai"
    chmod +x "$HOME/bin/ai"
    log_success "AI tool installed at $HOME/bin/ai"
}

# -----------------------
# ARGUMENT PARSING
# -----------------------
if [ $# -eq 0 ]; then
    log_info "Usage: ai <mode> [files/patterns/prompt]"
    exit 0
fi

case "$1" in
    init) shift; install_tool "$@" ;;
    -) shift; ai_file "$@" ;;
    +) shift; ai_script "$@" ;;
    \*) shift; ai_batch "$@" ;;
    .) shift; ai_env "$@" ;;
    :) shift
       IFS=':' read -r -a files <<< "$1"
       ai_pipeline "${files[@]}"
       ;;
    agi) shift
        case "$1" in
            +|~) shift; agi_watch "$@" ;;
            -) shift; agi_screenshot "$@" ;;
            *) shift; agi_watch "$@" ;;
        esac
        ;;
    *)
        PROMPT=$(get_prompt "$*")
        log_info "Running prompt on Ollama gemma3:1b..."
        if command -v ollama >/dev/null 2>&1; then
            pkill ollama || true
            ollama serve &
            sleep 2
            echo "$PROMPT" | ollama run "$OLLAMA_MODEL"
        else
            log_warn "Ollama not found, printing prompt only"
            echo "$PROMPT"
        fi
        ;;
esac