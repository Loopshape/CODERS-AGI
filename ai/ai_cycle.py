#!/usr/bin/env python3
import sys, json, asyncio, aiohttp, sqlite3, os, time

AGENTS = ["core", "loop", "code", "coin", "2244"]
MODEL_MAP = {
    "core": "core:latest",
    "loop": "loop:latest",
    "code": "code:latest",
    "coin": "coin:latest",
    "2244": "2244:latest"
}
CREW_POOL_MODEL = "deepseek-coder:latest"
OLLAMA_URL = "http://localhost:11434/api/generate"
DB_FILE = os.path.expanduser("~/_/qbits.db")

async def run_agent(session, agent, prompt):
    payload = {"model": MODEL_MAP[agent], "prompt": prompt, "stream": False}
    async with session.post(OLLAMA_URL, json=payload) as resp:
        data = await resp.text()
        return agent, data

async def run_cycle(seed):
    async with aiohttp.ClientSession() as session:
        tasks = [run_agent(session, agent, seed["prompt"]) for agent in AGENTS]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    conn = sqlite3.connect(DB_FILE)
    conn.execute("""CREATE TABLE IF NOT EXISTS qbits(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT,
        agent TEXT,
        response TEXT,
        timestamp REAL
    )""")
    for r in results:
        if isinstance(r, tuple):
            agent, data = r
            conn.execute(
                "INSERT INTO qbits(hash, agent, response, timestamp) VALUES (?, ?, ?, ?)",
                (seed["hash"], agent, data, time.time())
            )
            print(f"[{agent.upper()}] ✅ Response stored.")
        else:
            print(f"[Error] {r}")
    conn.commit()
    conn.close()
    print("[Crew-AI] 🧩 Consensus phase…")
    print("[Crew-AI] Done — qbits updated.")

if __name__ == "__main__":
    with open(sys.argv[1], "r") as f:
        seed = json.load(f)
    asyncio.run(run_cycle(seed))
