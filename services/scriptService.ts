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


// --- .bashrc integration ---
export const BASHRC_ADAPTATION_CODE = `
# To install, save the script as 'ai', give it execute permissions (chmod +x ai),
# and then run './ai init'.

# The 'ai init' command will adapt your ~/.bashrc file with the following content.
# A backup of your original .bashrc will be created.

# --- Content of ~/.bashrc after running 'ai init' ---
# ~/.bashrc adapted by AI tool
export PATH="$HOME/bin:$PATH"
alias ai="$HOME/bin/ai"
# Add more environment variables or shell customizations here
`;

export const getBashrcAdaptation = () => {
    const logs = [
        {type: LogType.Info, message: 'Generating .bashrc adaptation info...'},
        {type: LogType.Warn, message: "The 'ai init' command will create a backup and rewrite your existing ~/.bashrc."},
        {type: LogType.Success, message: 'Review the information below before running the installation.'},
    ];
    return { output: BASHRC_ADAPTATION_CODE.trim(), logs, fileName: 'bashrc_adaptation_info.txt' };
};


const AI_SCRIPT_CONTENT = `#!/usr/bin/env bash
# Author: Aris Arjuna Noorsanto <exe.opcode@gmail.com>
# AI / AGI / AIM Unified Processing Tool
# Termux / Proot-Distro compatible - All-in-one

set -eu
IFS=$'\\n\\t'

# -----------------------
# CONFIG
# -----------------------
HOME_ROOT="\${HOME:-/data/data/com.termux/files/home}"
BACKUP_DIR="\$HOME_ROOT/.ai_backups"
mkdir -p "\$BACKUP_DIR"

UNIVERSAL_LAW=\$(cat <<'EOF'
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
        return 1
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
# BASHRC ADAPTATION
# -----------------------
adapt_bashrc() {
    local bashrc="\$HOME_ROOT/.bashrc"
    backup_file "\$bashrc"
    log_info "Rewriting .bashrc..."
    cat > "\$bashrc" <<EOF
# ~/.bashrc adapted by AI tool
export PATH="\\\$HOME/bin:\\\$PATH"
alias ai="\\\$HOME/bin/ai"
# Add more environment variables or shell customizations here
EOF
    log_success ".bashrc rewritten and environment set"
}

# -----------------------
# AI MODES
# -----------------------
ai_file() {
    for f in "\$@"; do
        [ -f "\$f" ] || continue
        backup_file "\$f"
        log_info "Processing file: \$f"
        # AI processing via Ollama
        if command -v ollama >/dev/null 2>&1; then
            pkill ollama || true
            ollama serve &
            sleep 2
            cat "\$f" | ollama run "\$OLLAMA_MODEL"
        else
            log_warn "Ollama not found, writing universal law instead"
            echo "\$UNIVERSAL_LAW" > "\$f.processed"
        fi
    done
}

ai_script() {
    log_info "Processing script logic..."
    # Placeholder for AI script-aware processing
}

ai_batch() {
    local pattern="\$1"
    shift
    for f in \$pattern; do
        [ -f "\$f" ] || continue
        backup_file "\$f"
        log_info "Batch processing: \$f"
        ai_file "\$f"
    done
}

ai_env() {
    log_info "Scanning environment..."
    env | sort
    df -h
    ls -la "\$HOME_ROOT"
    ls -la /etc
}

ai_pipeline() {
    for f in "\$@"; do
        [ -f "\$f" ] || continue
        backup_file "\$f"
        log_info "Pipeline processing: \$f"
        ai_file "\$f"
    done
}

# -----------------------
# AGI MODES
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
                ai_file "\$file"
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
    mkdir -p "\$HOME/bin"
    cp -f "\$0" "\$HOME/bin/ai"
    chmod +x "\$HOME/bin/ai"
    log_success "AI tool installed at \$HOME/bin/ai"
}

# -----------------------
# ARGUMENT PARSING
# -----------------------
if [ \$# -eq 0 ]; then
    log_info "Usage: ai <mode> [files/patterns/prompt]"
    exit 0
fi

case "\$1" in
    init) shift; install_tool "\$@" ;;
    -) shift; ai_file "\$@" ;;
    +) shift; ai_script "\$@" ;;
    \\*) shift; ai_batch "\$@" ;;
    .) shift; ai_env "\$@" ;;
    :) shift
       IFS=':' read -r -a files <<< "\$1"
       ai_pipeline "\${files[@]}"
       ;;
    agi) shift
        case "\$1" in
            +|~) shift; agi_watch "\$@" ;;
            -) shift; agi_screenshot "\$@" ;;
            *) shift; agi_watch "\$@" ;;
        esac
        ;;
    *)
        PROMPT=\$(get_prompt "\$*")
        log_info "Running prompt on Ollama gemma3:1b..."
        if command -v ollama >/dev/null 2>&1; then
            pkill ollama || true
            ollama serve &
            sleep 2
            echo "\$PROMPT" | ollama run "\$OLLAMA_MODEL"
        else
            log_warn "Ollama not found, printing prompt only"
            echo "\$PROMPT"
        fi
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