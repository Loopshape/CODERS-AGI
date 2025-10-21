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
