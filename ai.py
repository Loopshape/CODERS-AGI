#!/usr/bin/env python3
import sys, json, sqlite3, hashlib, time

vibe_file = sys.argv[1]
db_file = sys.argv[2]
iterations = int(sys.argv[3])

# Load prompt JSON
with open(vibe_file, 'r') as f:
    data = json.load(f)
prompt = data['prompt']
hashval = data['hash']

# Initialize SQLite
conn = sqlite3.connect(db_file)
cur = conn.cursor()
cur.execute("""
CREATE TABLE IF NOT EXISTS qbits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT,
    agent TEXT,
    iteration INTEGER,
    response TEXT,
    timestamp REAL
)
""")

# Example: split prompt into 'qbit' chunks
qbits = [prompt[i:i+8] for i in range(0, len(prompt), 8)]

agents = ['core','loop','code','coin','2244','neuro']

for i in range(iterations):
    for agent in agents:
        for q in qbits:
            response = f"{q[::-1]}_{i}"  # dummy transform
            cur.execute("INSERT INTO qbits(hash,agent,iteration,response,timestamp) VALUES (?,?,?,?,?)",
                        (hashval, agent, i, response, time.time()))
            print(f"[PY] Qbit stored -> {q} (agent={agent}, iter={i})")

conn.commit()
conn.close()
