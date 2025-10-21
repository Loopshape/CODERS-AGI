#!/usr/bin/env bash
# ai-crew-installer.sh
# Fused, single-file installer for the 2244 Crew AI CLI.
# Writes Python orchestrator (multi-agent async), Node processor (fractal expansion), and final CLI wrapper.
set -euo pipefail

# --- Configuration ---
# Base paths
BASE_DIR="$HOME/_/ai"
BIN_DIR="$BASE_DIR/bin"
LIB_DIR="$BASE_DIR/lib"
LOCAL_BIN="$HOME/.local/bin"

# Script names
CLI_SH="$BASE_DIR/ai.sh"
CLI_PY="$BIN_DIR/ai_cli.py"
NODE_PROC="$LIB_DIR/processor.mjs"
SYMLINK="$LOCAL_BIN/ai"

# Agent Configuration (from the second script)
MEMORY_BASE="$BASE_DIR/memory"
AGENTS=("core" "loop" "code" "coin" "2244" "neuro")
declare -A MODEL_MAP=( ["core"]="core:latest"
                     ["loop"]="loop:latest"
                     ["code"]="code:latest"
                     ["coin"]="coin:latest"
                     ["2244"]="2244:latest"
                     ["neuro"]="gemma3:1b" )
CREW_POOL_MODEL="deepseek-coder:latest"

# --- Setup Directories ---
echo "🚀 Installing 2244 Crew AI CLI to: $BASE_DIR"
mkdir -p "$BIN_DIR" "$LIB_DIR" "$LOCAL_BIN" "$MEMORY_BASE" "$BASE_DIR/outputs"

# --- 1. Write Node.js Processor (Fractal Expansion) ---
cat > "$NODE_PROC" <<'NODEJS'
#!/usr/bin/env node
// processor.mjs
// Reads JSON from stdin and outputs JSON to stdout with modifications
// Implements simple fractal-style prompt expansion and math-based tuning

import readline from 'readline';

function hashString(s){
  // simple hash (FNV-like)
  let h = 2166136261 >>> 0;
  for(let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0).toString(16);
}

function fractalExpand(prompt, iterations){
  // create a fractal-like expansion: iterate, transform by golden ratio scaling and simple math
  const GOLD = 1.6180339887498948;
  let parts = [prompt];
  for(let i=1;i<Math.max(1, iterations); i++){
    const scale = (GOLD * i) % 1;
    // embed partial transformations to create 'self-similar' context
    const transform = `${prompt} -- fractal#${i} scale=${scale.toFixed(4)} epoch=${Date.now()}`;
    parts.push(transform);
  }
  return parts.join("\n\n");
}

function applyMathLaws(prompt, temp, iterations){
  // derive a numeric seed and append analytic hints
  const seed = parseInt(hashString(prompt).slice(0,8), 16) || 1;
  const adjustment = (temp - 0.5) * 2; // [-1,1] influence
  const numericHint = `// seed:${seed} adj:${adjustment.toFixed(3)} iter:${iterations}`;
  const expanded = fractalExpand(prompt, iterations);
  return {prompt: `${numericHint}\n\n${expanded}`, meta:{seed, adjustment, iterations}};
}

// read stdin
const rl = readline.createInterface({ input: process.stdin, terminal: false });
let data = '';
rl.on('line', (line) => { data += line + '\n'; });
rl.on('close', () => {
  try {
    const input = JSON.parse(data || '{}');
    const prompt = input.prompt || '';
    const temp = Number(input.temp || 0.7);
    const iterations = Number(input.iterations || 1);
    const res = applyMathLaws(prompt, temp, iterations);
    console.log(JSON.stringify({ ok: true, processedPrompt: res.prompt, meta: res.meta }));
  } catch (e) {
    console.error(JSON.stringify({ ok:false, error: e.message }));
    process.exit(1);
  }
});
NODEJS
chmod +x "$NODE_PROC"
echo "✅ Node processor written: $NODE_PROC"

# --- 2. Write Python 3 Orchestrator (Ollama Multi-Agent) ---
# NOTE: The python code is written to be a standalone script that reads config from env vars
cat > "$CLI_PY" <<'PYTHON'
#!/usr/bin/env python3
# ai_cli.py - Orchestrator for local Ollama models, parallel hyper-reasoning, neuro observe
import os, sys, json, sqlite3, time, hashlib, asyncio, aiohttp
from typing import Dict, Any, List

# Configuration is read from environment variables set by the bash wrapper
AGENTS: List[str] = json.loads(os.environ.get("AGENTS_JSON","[]"))
MODEL_MAP: Dict[str, str] = json.loads(os.environ.get("MODEL_JSON","{}"))
CREW_POOL_MODEL: str = os.environ.get("CREW_POOL_MODEL", "deepseek-coder:latest")
MEMORY_BASE: str = os.environ.get("MEMORY_BASE", "/tmp/ai_memory")
NODE_PROC_PATH: str = os.environ.get("NODE_PROC_PATH") # Path to the processor.mjs

def init_memory(agent: str) -> sqlite3.Connection:
    """Initialize SQLite database for an agent's memory."""
    path = os.path.join(MEMORY_BASE, f"{agent}.db")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path)
    c = conn.cursor()
    # qbits stores key metadata or full responses
    c.execute("CREATE TABLE IF NOT EXISTS qbits (id TEXT PRIMARY KEY, data TEXT, ts REAL)")
    conn.commit()
    return conn

async def get_processed_prompt(prompt: str, temp: float = 0.7, iterations: int = 1) -> str:
    """Passes the prompt to the Node.js processor for fractal expansion."""
    if not NODE_PROC_PATH:
        print("⚠ NODE_PROC_PATH not set. Skipping prompt processing.", file=sys.stderr)
        return prompt

    input_data = json.dumps({"prompt": prompt, "temp": temp, "iterations": iterations})
    
    # Use asyncio to run the subprocess
    proc = await asyncio.create_subprocess_exec(
        'node', NODE_PROC_PATH,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    stdout, stderr = await proc.communicate(input_data.encode('utf-8'))
    
    if proc.returncode != 0:
        print(f"❌ Processor error (code {proc.returncode}): {stderr.decode()}", file=sys.stderr)
        return prompt

    try:
        result = json.loads(stdout.decode().strip())
        if result.get("ok"):
            print(f"[{result['meta']['iterations']} Iterations, Seed:{result['meta']['seed']}]", file=sys.stderr)
            return result.get("processedPrompt", prompt)
        else:
            print(f"❌ Processor returned error: {result.get('error')}", file=sys.stderr)
            return prompt
    except json.JSONDecodeError:
        print("❌ Processor output was not valid JSON.", file=sys.stderr)
        return prompt

async def stream_agent(session: aiohttp.ClientSession, agent: str, prompt: str, temperature: float = 0.7):
    """Streams a response from a single Ollama model."""
    model = MODEL_MAP.get(agent, agent) # Use agent name as model name if not mapped
    url = "http://localhost:11434/api/generate"
    
    # Apply special model for the Crew Pool task
    if agent == "Crew-AI":
        model = CREW_POOL_MODEL

    payload = {"model": model, "prompt": prompt, "stream": True, "options":{"temperature":temperature}}
    
    start_time = time.time()
    print(f"\n[{agent.upper()} ({model})] 🚀 Tasking...", file=sys.stderr)

    try:
        async with session.post(url, json=payload, timeout=300) as resp:
            if resp.status != 200:
                print(f"[{agent.upper()}] ❌ HTTP {resp.status} - Check Ollama/model availability", file=sys.stderr)
                return
            
            full_response = ""
            async for line in resp.content:
                chunk = line.decode('utf-8').strip()
                if not chunk: continue
                try:
                    data = json.loads(chunk)
                    if "response" in data:
                        response_text = data['response']
                        print(response_text, end="")
                        sys.stdout.flush()
                        full_response += response_text
                    
                    if data.get("done", False):
                        # Save final response to memory (simplified)
                        conn = init_memory(agent)
                        c = conn.cursor()
                        response_hash = hashlib.sha256(full_response.encode()).hexdigest()
                        c.execute("INSERT OR REPLACE INTO qbits VALUES (?, ?, ?)", (response_hash, full_response, time.time()))
                        conn.commit()
                        conn.close()
                        break
                except json.JSONDecodeError:
                    pass # Ignore malformed chunks
                except Exception as e:
                    print(f"[{agent.upper()}] ⚠ Inner error: {e}", file=sys.stderr)
                    break

            end_time = time.time()
            print(f"\n[{agent.upper()}] ✅ Stream ended ({end_time-start_time:.2f}s)", file=sys.stderr)

    except aiohttp.ClientError as e:
        print(f"\n[{agent.upper()}] ❌ Connection Error: {e}", file=sys.stderr)
    except TimeoutError:
        print(f"\n[{agent.upper()}] ❌ Request Timed Out.", file=sys.stderr)
    except Exception as e:
        print(f"\n[{agent.upper()}] ❌ Unexpected Error: {e}", file=sys.stderr)


async def run_all(original_prompt: str):
    """Runs all agents in parallel with the processed prompt."""
    
    # 1. Process the prompt
    processed_prompt = await get_processed_prompt(original_prompt)

    # 2. Run agents
    async with aiohttp.ClientSession() as session:
        # Include the defined agents and the general Crew-AI model
        all_agents = AGENTS + ["Crew-AI"]
        tasks = [stream_agent(session, agent, processed_prompt) for agent in all_agents]
        
        # Await all tasks concurrently
        await asyncio.gather(*tasks)

if __name__=="__main__":
    if len(sys.argv) < 2:
        print("Usage: ai 'Your prompt here'", file=sys.stderr)
        sys.exit(1)
    
    # Reconstruct the original prompt from all command line arguments
    original_prompt = " ".join(sys.argv[1:])
    
    try:
        asyncio.run(run_all(original_prompt))
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.", file=sys.stderr)
        sys.exit(1)
PYTHON
chmod +x "$CLI_PY"
echo "✅ Python orchestrator written: $CLI_PY"

# --- 3. Write Final Bash CLI Wrapper (ai.sh) ---
cat > "$CLI_SH" <<'BASH_CLI'
#!/usr/bin/env bash
# ai.sh – Local Ollama multi-agent orchestrator (Neuro-driven)

# Set up environment variables for the Python backend
export AI_BASE="$HOME/_/ai"
export MEMORY_BASE="$AI_BASE/memory"
export CLI_PY="$AI_BASE/bin/ai_cli.py"
export NODE_PROC_PATH="$AI_BASE/lib/processor.mjs"

# Export agent configuration
export AGENTS_JSON='["core", "loop", "code", "coin", "2244", "neuro"]'
export MODEL_JSON='{"core": "core:latest", "loop": "loop:latest", "code": "code:latest", "coin": "coin:latest", "2244": "2244:latest", "neuro": "gemma3:1b"}'
export CREW_POOL_MODEL="deepseek-coder:latest"

# Check for prompt
if [ $# -eq 0 ]; then
    echo "⚠ Provide prompt: ai 'Your query here'"
    exit 1
fi

# Pass the prompt arguments to the Python orchestrator
exec "$CLI_PY" "$@"
BASH_CLI
chmod +x "$CLI_SH"
echo "✅ Shell wrapper written: $CLI_SH"

# --- 4. Create Symlink ---
# Check if $HOME/.local/bin is in PATH (standard location for local executables)
if ! grep -q "$LOCAL_BIN" <(echo "$PATH"); then
    echo "🔔 WARNING: $LOCAL_BIN is not in your \$PATH. You may need to add it manually to run 'ai'."
    echo "   (e.g., add 'export PATH=\"\$HOME/.local/bin:\$PATH\"' to your ~/.bashrc or ~/.zshrc)"
fi

# Create or update the symlink
ln -sf "$CLI_SH" "$SYMLINK"
echo "✅ CLI 'ai' symlinked to: $SYMLINK"

echo "--------------------------------------------------------"
echo "🎉 Installation Complete! Run 'ai' with your prompt."
echo "   Example: ai 'What is the golden ratio and how is it used in programming?'"
echo "--------------------------------------------------------"
