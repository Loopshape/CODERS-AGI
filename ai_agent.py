#!/usr/bin/env python3
import sys, json, time, sqlite3, aiohttp, asyncio, hashlib

agent, model, prompt = sys.argv[1:4]
db_file = f"{__import__('os').path.expanduser('~/_/ai/memory/memory.db')}"

async def stream_agent():
    ts = time.time()
    qbit_hash = hashlib.sha256(f"{agent}:{prompt}:{ts}".encode()).hexdigest()
    entropy = int(qbit_hash[:8], 16) % 1000
    collected = []

    async with aiohttp.ClientSession() as session:
        async with session.post("http://localhost:11434/api/generate", json={"model": model, "prompt": prompt, "stream": True}) as resp:
            async for line in resp.content:
                chunk = line.decode("utf-8").strip()
                if not chunk: continue
                try:
                    data = json.loads(chunk)
                    if "response" in data:
                        print(f"[{agent}] {data['response']}")
                        collected.append(data["response"])
                except: pass

    conn = sqlite3.connect(db_file)
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS qbits(id TEXT PRIMARY KEY, json TEXT, timestamp REAL, weight REAL);")
    weight = entropy / (1 + time.time() - ts)
    c.execute("INSERT OR REPLACE INTO qbits(id,json,timestamp,weight) VALUES (?,?,?,?)",
              (agent, json.dumps({"prompt": prompt, "qbit": qbit_hash, "responses": collected}), ts, weight))
    conn.commit()
    conn.close()

asyncio.run(stream_agent())
