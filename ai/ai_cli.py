#!/usr/bin/env python3
"""
2244 Crew CLI: Neuro + Crew Pool + Parallel Agents
Streams live to cockpit WebSocket, persists qbits to SQLite.
"""

import asyncio, aiohttp, json, os, sys, sqlite3, time, subprocess, websockets

# -------------------------------
# Configuration
# -------------------------------
AI_MODELS = {
    "core": "core:latest",
    "loop": "loop:latest",
    "code": "code:latest",
    "coin": "coin:latest",
    "2244": "2244:latest",
    "neuro": "gemma3:1b",
    "crew_pool": "deepseek-coder:latest"
}
AGENTS_ORDER = ["neuro", "core", "loop", "code", "coin", "2244", "crew_pool"]
OLLAMA_API = "http://localhost:11434/api/generate"
MEM_DB = os.path.expanduser("~/_/ai/db/qbits.sqlite")
WS_URL = "ws://localhost:9000"  # cockpit WebSocket

os.makedirs(os.path.dirname(MEM_DB), exist_ok=True)
conn = sqlite3.connect(MEM_DB)
c = conn.cursor()
c.execute("CREATE TABLE IF NOT EXISTS qbits(prompt TEXT, agent TEXT, response TEXT, ts REAL)")
conn.commit()

# -------------------------------
# Ollama check/start
# -------------------------------
async def check_ollama():
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("http://localhost:11434/api/tags") as resp:
                return resp.status == 200
    except: return False

def start_ollama():
    subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(5)

# -------------------------------
# Stream agent
# -------------------------------
async def stream_agent(agent, prompt, session, ws):
    model = AI_MODELS[agent]
    await ws.send(json.dumps({"agent": agent, "status": "online", "text": "🚀 Starting stream..."}))
    try:
        async with session.post(OLLAMA_API, json={"model": model, "prompt": prompt, "stream": True}) as resp:
            if resp.status != 200:
                await ws.send(json.dumps({"agent": agent, "status": "offline", "text": f"❌ HTTP {resp.status}"}))
                return
            async for chunk in resp.content.iter_any(2048):
                text = chunk.decode("utf-8").strip()
                if not text: continue
                for line in text.split("\n"):
                    line = line.strip()
                    if not line: continue
                    try:
                        data = json.loads(line)
                        if "response" in data:
                            await ws.send(json.dumps({"agent": agent, "status": "online", "text": data["response"]}))
                    except: pass
        await ws.send(json.dumps({"agent": agent, "status": "online", "text": "✅ Stream ended."}))
        c.execute("INSERT INTO qbits(prompt, agent, response, ts) VALUES (?, ?, ?, ?)", (prompt, agent, '', time.time()))
        conn.commit()
    except Exception as e:
        await ws.send(json.dumps({"agent": agent, "status": "offline", "text": f"❌ Error: {str(e)}"}))

# -------------------------------
# Main
# -------------------------------
async def main():
    prompt = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else input("Enter human prompt: ").strip()
    if not prompt:
        print("⚠ Empty prompt. Exiting.")
        return

    if not await check_ollama():
        print("Starting Ollama server...")
        start_ollama()
        if not await check_ollama():
            print("❌ Ollama server not responding. Exiting.")
            return

    async with aiohttp.ClientSession() as session:
        async with websockets.connect(WS_URL) as ws:
            # Neuro first
            await stream_agent("neuro", prompt, session, ws)
            # Parallel remaining agents
            tasks = [stream_agent(a, prompt, session, ws) for a in AGENTS_ORDER if a != "neuro"]
            await asyncio.gather(*tasks)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    finally:
        conn.close()
