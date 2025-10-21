#!/usr/bin/env python3
# ~/_/ai/ai.py
import os, sys, sqlite3, time, hashlib, json
PROMPT = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else input("Enter human prompt: ")

# DB setup
DB_DIR = os.path.expanduser("~/__ai_db")
DB_PATH = os.path.join(DB_DIR, "qbits.db")
os.makedirs(DB_DIR, exist_ok=True)

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Table creation
c.execute('''
CREATE TABLE IF NOT EXISTS qbits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT,
    prompt TEXT,
    hash TEXT,
    iteration INTEGER,
    response TEXT,
    timestamp REAL,
    temp REAL
)
''')
conn.commit()

# Hyper-entropy hash
fractal_hash = hashlib.sha256(PROMPT.encode()).hexdigest()
print(f"[NEXUS] ⚙️ Generated entropy hash: {fractal_hash}")

# Example Neuro reasoning loop
TEMP = 0.5
ITERATIONS = 5
agents = ["neuro", "core", "loop", "code", "coin", "2244"]

for i in range(ITERATIONS):
    for agent in agents:
        response = f"{PROMPT} ({agent} reasoning iter {i+1})"
        c.execute(
            "INSERT INTO qbits (agent,prompt,hash,iteration,response,timestamp,temp) VALUES (?,?,?,?,?,?,?)",
            (agent, PROMPT, fractal_hash, i+1, response, time.time(), TEMP)
        )
        print(f"[{agent.upper()}] Iter {i+1}: {response}")
conn.commit()

# JSON snapshot
tmp_dir = os.path.expanduser("~/__ai_tmp")
os.makedirs(tmp_dir, exist_ok=True)
filename = os.path.join(tmp_dir, f"{fractal_hash}.json")
with open(filename, "w") as f:
    json.dump({"prompt": PROMPT, "hash": fractal_hash, "responses": [{"agent": a, "iter": i+1, "resp": f"{PROMPT} ({a} reasoning iter {i+1})"} for a in agents for i in range(ITERATIONS)]}, f, indent=2)

print(f"[NEXUS] ✅ Hyper-reasoning completed. JSON outputs stored in {filename}")
