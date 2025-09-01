import { LogType, ProcessedFile } from '../types';
import { getGeminiSuggestions } from './geminiService';

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
        logs.push({ type: LogType.Info, message: `Processing file ${i + 1}/${totalFiles}: ${file.name}` });

        try {
            const fileContent = await file.text();
            logs.push({ type: LogType.Gemini, message: `Sending ${file.name} to Gemini AI for enhancement...` });
            
            const enhancedContent = await getGeminiSuggestions(fileContent);

            outputs.push({
              fileName: `${file.name}.enhanced.txt`,
              content: enhancedContent,
            });
            
            logs.push({ type: LogType.Success, message: `Successfully enhanced ${file.name}.` });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            logs.push({ type: LogType.Error, message: `Failed to enhance ${file.name}: ${errorMessage}` });
            outputs.push({
              fileName: file.name,
              content: `/* --- ERROR PROCESSING ${file.name}: ${errorMessage} --- */`
            });
        }
        
        const progress = Math.round(((i + 1) / totalFiles) * 100);
        onProgress(progress);
        await new Promise(res => setTimeout(res, 50));
    }

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
        {type: LogType.Warn, message: `Awareness: Direct prompt mode | UNIVERSAL_LAW active`},
        {type: LogType.Info, message: 'Processing prompt...'},
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


export const debugScript = () => {
    const logs = [
        {type: LogType.Info, message: 'Initiating script debug sequence...'},
        {type: LogType.Warn, message: 'Debug Mode: ON. Verbose output enabled.'},
        {type: LogType.Info, message: 'Script Version: 1.0.0'},
        {type: LogType.Info, message: 'Backup Directory: /app/home/.ai_backups'},
        {type: LogType.Info, message: 'Ollama Endpoint: http://127.0.0.1:11434'},
    ];
    const output = `
[DEBUG MODE]
---
Script Version: 1.0.0
Timestamp: ${new Date().toISOString()}
---
[Configuration]
HOME_ROOT=/app/home
BACKUP_DIR=/app/home/.ai_backups
OLLAMA_HOST=127.0.0.1
OLLAMA_PORT=11434
---
[Status]
Script loaded successfully.
Ready for command execution.
    `.trim();

    return { output, logs, fileName: 'script_debug.log' };
}

// --- .bashrc integration ---
export const BASHRC_INTEGRATION_CODE = `
# The new 'ai' script handles its own installation and .bashrc configuration.
# To install, save the script as 'ai', give it execute permissions (chmod +x ai),
# and then run './ai init'.

# The 'ai init' command will completely overwrite your ~/.bashrc file with the following content.
# It is recommended to back up your current .bashrc if you have custom configurations.

# --- Content of ~/.bashrc after running 'ai init' ---
# ~/.bashrc rebuilt by ~/bin/ai
export PATH="$HOME/bin:$PATH"
alias ai="$HOME/bin/ai"
export AI_HOME="$HOME_ROOT"
`;

export const getBashrcIntegration = () => {
    const logs = [
        {type: LogType.Info, message: 'Generating .bashrc integration info...'},
        {type: LogType.Warn, message: "The 'ai init' command will overwrite your existing ~/.bashrc."},
        {type: LogType.Success, message: 'Review the information below before running the installation.'},
    ];
    return { output: BASHRC_INTEGRATION_CODE.trim(), logs, fileName: 'bashrc_info.txt' };
};


const AI_SCRIPT_CONTENT = `#!/usr/bin/env bash
# Author: Aris Arjuna Noorsanto <exe.opcode@gmail.com>
# AI / AGI / AIM Unified Processing Tool
# Termux / Proot-Distro compatible, single-file

set -eu
IFS=\$(printf '\\n\\t')

# -----------------------
# CONFIG
# -----------------------
HOME_ROOT="\${HOME:-/data/data/com.termux/files/home}"
BACKUP_DIR="\$HOME_ROOT/.ai_backups"
mkdir -p "\$BACKUP_DIR"

MODEL_DIR="\$HOME_ROOT/.model"
mkdir -p "\$MODEL_DIR"

UNIVERSAL_LAW=\$(cat <<'EOF'
:bof:
redo complete layout and design an advanced symetrics to proximity accordance for dedicated info-quota alignments, which grant a better adjustment for leading besides subliminal range compliance promisings, that affair any competing content relations into a cognitive intuitition guidance comparison between space and gap implies, that are suggesting the viewer a subcoordinated
experience alongside repetitive tasks and stoic context sortings, all cooperational aligned to timed subjects of importance accordingly to random
capacity within builds of data statements, that prognose the grid reliability
of a mockup as given optically acknowledged for a more robust but also as
attractive rulership into golden-ratio item handling
:eof:
EOF
)

# -----------------------
# HELPER LOGGING
# -----------------------
log_info()    { printf '\\033[34m[*] %s\\033[0m\\n' "\$*"; }
log_success() { printf '\\033[32m[+] %s\\033[0m\\n' "\$*"; }
log_warn()    { printf '\\033[33m[!] %s\\033[0m\\n' "\$*"; }
log_error()   { printf '\\033[31m[-] %s\\033[0m\\n' "\$*"; }

backup_file() {
    local file="\$1"
    if [ -f "\$file" ]; then
        local ts
        ts=\$(date +%Y%m%d%H%M%S)
        cp "\$file" "\$BACKUP_DIR/\$(basename "\$file").\$ts.bak"
        log_info "Backup created for \$file -> \$BACKUP_DIR"
    fi
}

fetch_url() {
    local url="\$1"
    if command -v curl >/dev/null 2>&1; then
        curl -sL "\$url"
    elif command -v wget >/dev/null 2>&1; then
        wget -qO- "\$url"
    else
        log_error "curl or wget required to fetch URLs"
    fi
}

get_prompt() {
    local input="\$1"
    case "\$input" in
        http://*|https://*)
            fetch_url "\$input"
            ;;
        *)
            if [ -f "\$input" ]; then
                cat "\$input"
            else
                echo "\$input"
            fi
            ;;
    esac
}

# -----------------------
# OLLAMA GEMMA3:1B INTEGRATION
# -----------------------
ollama_init() {
    if ! pgrep -f "ollama serve" >/dev/null 2>&1; then
        log_info "Starting Ollama server for gemma3:1b..."
        ollama serve &> /dev/null &
        sleep 2
        log_success "Ollama server started."
    else
        log_info "Ollama server already running."
    fi
}

ollama_prompt() {
    local prompt_input="\$1"
    ollama_init
    log_info "Running prompt on gemma3:1b..."
    if command -v ollama >/dev/null 2>&1; then
        echo "\$prompt_input" | ollama run gemma3:1b
    else
        log_error "Ollama CLI not found. Install gemma3:1b."
    fi
}

# -----------------------
# AI / AGI / AIM MODES
# -----------------------
mode_file() {
    for f in "\$@"; do
        [ -f "\$f" ] || continue
        backup_file "\$f"
        log_info "Processing file: \$f"
        echo "\$UNIVERSAL_LAW" > "\$f.processed"
    done
}

mode_script() {
    log_info "Processing script content..."
    # Placeholder for script-aware logic
}

mode_batch() {
    local pattern="\$1"; shift
    for f in \$pattern; do
        [ -f "\$f" ] || continue
        backup_file "\$f"
        log_info "Batch processing \$f"
    done
}

mode_env() {
    log_info "Scanning environment..."
    env | sort
    df -h
    ls -la "\$HOME_ROOT"
    ls -la /etc
}

mode_pipeline() {
    for f in "\$@"; do
        [ -f "\$f" ] || continue
        backup_file "\$f"
        log_info "Pipeline processing: \$f"
    done
}

# -----------------------
# AGI WATCH & SCREENSHOT
# -----------------------
agi_watch() {
    local folder="\$1"
    local pattern="\${2:-*}"
    log_info "Watching \$folder for changes matching \$pattern"
    command -v inotifywait >/dev/null 2>&1 || { log_error "Install inotify-tools"; return; }
    inotifywait -m -r -e modify,create,move --format '%w%f' "\$folder" | while read file; do
        case "\$file" in
            \$pattern)
                log_info "Detected change: \$file"
                mode_file "\$file"
                ;;
        esac
    done
}

agi_screenshot() {
    log_info "Screenshot disabled in Termux/Proot"
}

# -----------------------
# BASHRC REBUILD
# -----------------------
rebuild_bashrc() {
    local bashrc="\$HOME_ROOT/.bashrc"
    backup_file "\$bashrc"
    log_info "Rebuilding .bashrc..."
    cat > "\$bashrc" <<EOF
# ~/.bashrc rebuilt by ~/bin/ai
export PATH="\\\$HOME/bin:\\\$PATH"
alias ai="\\\$HOME/bin/ai"
export AI_HOME="\\\$HOME_ROOT"
EOF
    log_success ".bashrc rewritten successfully."
}

# -----------------------
# INSTALLER MODE
# -----------------------
mode_init() {
    log_info "Initializing AI/AGI/AIM tool..."
    mkdir -p "\$HOME_ROOT/bin"
    cp -f "\$0" "\$HOME_ROOT/bin/ai"
    chmod +x "\$HOME_ROOT/bin/ai"
    rebuild_bashrc
    log_success "Tool installed as ~/bin/ai and .bashrc updated."
}

# -----------------------
# ARGUMENT PARSING
# -----------------------
if [ \$# -eq 0 ]; then
    log_info "Usage: \$0 <mode> [files/patterns] [prompt]"
    exit 0
fi

case "\$1" in
    init) shift; mode_init "\$@" ;;
    -) shift; mode_file "\$@" ;;
    +) shift; mode_script "\$@" ;;
    \\*) shift; mode_batch "\$@" ;;
    .) shift; mode_env "\$@" ;;
    :) shift; IFS=':' read -r -a files <<< "\$1"; mode_pipeline "\${files[@]}" ;;
    agi) shift
        case "\$1" in
            +|~) shift; agi_watch "\$@" ;;
            -) shift; agi_screenshot "\$@" ;;
            *) shift; agi_watch "\$@" ;;
        esac
        ;;
    *)
        PROMPT=\$(get_prompt "\$*")
        ollama_prompt "\$PROMPT"
        ;;
esac
`;

export const getInstallScript = () => {
    const logs = [
        {type: LogType.Info, message: 'Generating self-installing `ai` script...'},
        {type: LogType.Success, message: 'Save this script as `ai`, run `chmod +x ai`, then `./ai init`.'},
    ];
    return { output: AI_SCRIPT_CONTENT.trim(), logs, fileName: 'ai' };
};
