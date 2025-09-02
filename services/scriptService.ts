


import { LogType, ProcessedFile } from '../types';

export const UNIVERSAL_LAW = `:bof:
redo complete layout and design an advanced symetrics to proximity accordance for dedicated info-quota alignments, which grant a better adjustment for leading besides subliminal range compliance promisings, that affair any competing content relations into a cognitive intuitition guidance comparison between space and gap implies, that are suggesting the viewer a subcoordinated experience alongside repetitive tasks and stoic context sortings, all cooperational aligned to timed subjects of importance accordingly to random capacity within builds of data statements, that prognose the grid reliability
of a mockup as given optically acknowledged for a more robust but also as
attractive rulership into golden-ratio item handling
:eof:`;

export const checkOllamaStatus = async (): Promise<boolean> => {
    // This is a simulation. In a real application, you might ping an endpoint.
    // For this simulation, we'll assume the service is running.
    await new Promise(resolve => setTimeout(resolve, 50)); // simulate a quick check
    return true;
};

// Fix: Rename aiFile to processFiles
export const processFiles = async (files: File[], onProgress: (progress: number) => void): Promise<{ outputs: ProcessedFile[]; logs: { type: LogType; message: string; }[] }> => {
    const logs: {type: LogType, message: string}[] = [];
    const outputs: ProcessedFile[] = [];
    const totalFiles = files.length;

    if (totalFiles === 0) {
        logs.push({type: LogType.Warn, message: 'No files selected for processing.'});
        return { outputs: [], logs };
    }

    for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        
        logs.push({ type: LogType.Info, message: `Processing file: ${file.name}` });
        logs.push({ type: LogType.Info, message: `Backup created for ${file.name}` });
        // Simulate the script's fallback behavior when Ollama is not present
        logs.push({ type: LogType.Warn, message: `Ollama not found, writing universal law instead` });

        outputs.push({
            fileName: `${file.name}.processed`,
            content: UNIVERSAL_LAW,
        });
        
        const progress = Math.round(((i + 1) / totalFiles) * 100);
        onProgress(progress);
        await new Promise(res => setTimeout(res, 100));
    }

    logs.push({ type: LogType.Success, message: 'File processing simulation complete.' });

    return { outputs, logs };
};

// Fix: Rename aiEnv to scanEnvironment
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
...

[Home Directory]
total 8
drwxr-xr-x 1 webapp_user webapp_user 4096 Jul 30 10:00 .
drwxr-xr-x 1 root        root        4096 Jul 30 09:58 ..
`;
    return { output: output.trim(), logs, fileName: 'environment_scan.txt' };
}

// Fix: Rename aiPrompt to processPrompt and call local AI
export const processPrompt = async (prompt: string) => {
    const command = '/usr/local/bin/ollama run gemma3:1b';
    const logs: { type: LogType; message: string; }[] = [];

    const isOllamaRunning = await checkOllamaStatus();
    if (!isOllamaRunning) {
        logs.push({ type: LogType.Error, message: 'Ollama service is unavailable. Please ensure it is running to process AI commands.' });
        return { output: 'Ollama service not available.', logs, fileName: 'error.log' };
    }

    logs.push({type: LogType.Info, message: `Redirecting prompt to local AI: ${command}`});
    logs.push({type: LogType.Info, message: `Calling local AI API at http://127.0.0.1:11434...`});

    try {
        const response = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemma3:1b',
                prompt: prompt,
                stream: false
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        logs.push({type: LogType.Success, message: 'Successfully received response from local AI.'});
        return { output: data.response.trim(), logs, fileName: 'prompt_output.txt' };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        if (error instanceof Error && error.message.includes('Failed to fetch')) {
             logs.push({ type: LogType.Error, message: 'Connection to Local AI failed. Is the service running at http://127.0.0.1:11434?' });
        } else {
             logs.push({ type: LogType.Error, message: `Local AI request failed: ${errorMessage}` });
        }
        logs.push({ type: LogType.Warn, message: 'Fallback: returning prompt as output.' });
        return { output: prompt, logs, fileName: 'prompt_output.txt' };
    }
}

// Fix: Add new function processUrlPrompt
export const processUrlPrompt = (url: string) => {
    const logs = [
        {type: LogType.Info, message: `Fetching content from URL: ${url}`},
        {type: LogType.Warn, message: 'This is a simulation. No real network request is made.'}
    ];
    const output = `
<!DOCTYPE html>
<html>
<head>
    <title>Simulated Content for ${url}</title>
</head>
<body>
    <h1>Page from ${url}</h1>
    <p>This is simulated content fetched from the provided URL.</p>
</body>
</html>
    `.trim();
    return { output, logs, fileName: `content_from_url.html` };
};

// Fix: Update getInstallScript to generate a proper proot-distro installer.
export const getInstallScript = () => {
    const logs = [
        { type: LogType.Info, message: 'Generating proot-distro installer script...' },
        { type: LogType.Info, message: 'This script will install the `ai` command inside your Linux container.' },
        { type: LogType.Success, message: 'Installer script ready for download.' }
    ];

    const aiScriptContent = `#!/bin/bash
# AI/AGI/AIM Unified Processing Tool v2.0
# This script is installed by the ai-installer.sh

# This is a fallback for when a local AI model is not available.
UNIVERSAL_LAW=\`cat <<'EOF'
:bof:
redo complete layout and design an advanced symetrics to proximity accordance for dedicated info-quota alignments, which grant a better adjustment for leading besides subliminal range compliance promisings, that affair any competing content relations into a cognitive intuitition guidance comparison between space and gap implies, that are suggesting the viewer a subcoordinated experience alongside repetitive tasks and stoic context sortings, all cooperational aligned to timed subjects of importance accordingly to random capacity within builds of data statements, that prognose the grid reliability
of a mockup as given optically acknowledged for a more robust but also as
attractive rulership into golden-ratio item handling
:eof:
EOF
\`

echo "AI Tool v2.0 (proot-distro edition)"
echo "Command executed with arguments: \$@"
echo ""
echo "Simulating AI processing..."
echo "Ollama not found, writing universal law instead."
echo "\$UNIVERSAL_LAW"
`;

    const installerScript = `#!/bin/bash
#
# AI Tool Installer for Termux proot-distro
#
# This script installs the 'ai' command-line tool into a proot-distro
# environment. It places the main script in /usr/local/bin/ai, makes it
# executable, and creates a symlink in your home directory for easy access.
#

# --- Configuration ---
# The name of your proot-distro installation (e.g., ubuntu, debian).
# Change this if you use a different name.
DISTRO="debian"

# --- Main script content to be installed ---
# Using a HEREDOC with a quoted delimiter to prevent shell expansion.
read -r -d '' AI_SCRIPT_CONTENT << 'EOF'
${aiScriptContent}
EOF

# --- Installation Logic ---
set -e # Exit immediately if a command exits with a non-zero status.

echo "--- Starting installation of 'ai' tool into the '$DISTRO' proot-distro ---"

# 1. Check if proot-distro command exists
if ! command -v proot-distro &> /dev/null; then
    echo "[ERROR] 'proot-distro' command not found."
    echo "Please ensure you are running this script within Termux and have proot-distro installed."
    exit 1
fi

echo "[INFO] Found proot-distro. Checking for '$DISTRO' container..."

# 2. Write the script content to /usr/local/bin/ai inside the distro
echo "[INFO] Writing script to /usr/local/bin/ai (requires sudo)..."
echo "$AI_SCRIPT_CONTENT" | proot-distro login "$DISTRO" -- sudo tee /usr/local/bin/ai > /dev/null
echo "[SUCCESS] Script file written."

# 3. Make the script executable
echo "[INFO] Setting execute permissions..."
proot-distro login "$DISTRO" -- sudo chmod +x /usr/local/bin/ai
echo "[SUCCESS] Permissions set."

# 4. Create symlink in user's home directory
echo "[INFO] Creating symlink in user's home directory..."
proot-distro login "$DISTRO" -- bash -c '
    set -e
    mkdir -p "$HOME/bin"
    ln -sf /usr/local/bin/ai "$HOME/bin/ai"
    echo "[SUCCESS] Symlink created at $HOME/bin/ai"
'

echo "
---------------------------------------------------------------------
✅ Installation Complete!
---------------------------------------------------------------------

The 'ai' command is now installed in your '$DISTRO' environment.

To use it:
1. Log into your distro:
   proot-distro login $DISTRO

2. Run the command:
   ai your-prompt-here

NOTE: If the 'ai' command is not found, you may need to add '$HOME/bin'
to your PATH. Add the following line to your ~/.bashrc or ~/.zshrc
inside the distro, then restart your shell:

   export PATH=\\$HOME/bin:\\$PATH

---------------------------------------------------------------------
"
`.trim();

    return { output: installerScript, logs, fileName: 'ai-installer.sh' };
};

export const gitPull = (url: string) => {
    const logs = [
        { type: LogType.Info, message: `Simulating: git pull from ${url}` },
        { type: LogType.Info, message: 'Fetching origin...' },
        { type: LogType.Success, message: 'Already up to date.' }
    ];
    const output = `From ${url}\n * branch main -> FETCH_HEAD\nAlready up to date.`;
    return { output, logs, fileName: 'git_pull.log' };
};

export const gitPush = (url: string) => {
    const logs = [
        { type: LogType.Info, message: `Simulating: git push to ${url}` },
        { type: LogType.Info, message: 'Enumerating objects: 5, done.' },
        { type: LogType.Info, message: 'Writing objects: 100% (3/3), done.' },
        { type: LogType.Success, message: `To ${url}\n   abcdef..123456  main -> main` }
    ];
    const output = `Pushing to ${url}\nDone.`;
    return { output, logs, fileName: 'git_push.log' };
};
