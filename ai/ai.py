#!/usr/bin/env python3
import os, sys, json, sqlite3, time, hashlib, asyncio, aiohttp

DB_FILE = os.path.join(os.path.dirname(__file__), 'ai.db')
os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)

# Initialize SQLite
conn = sqlite3.connect(DB_FILE)
c = conn.cursor()
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

prompt = sys.argv[1] if len(sys.argv) > 1 else input("Enter human prompt: ")

# Generate entropy hash
fractal_hash = hashlib.sha256(prompt.encode()).hexdigest()
print(f"[NEXUS] ⚙️ Generated entropy hash: {fractal_hash}")

# Example iteration
temp_factor = 0.5
recursion_depth = 5

for i in range(1, recursion_depth + 1):
    response = f"{prompt} (iteration {i})"
    c.execute(
        "INSERT INTO qbits (agent,prompt,hash,iteration,response,timestamp,temp) VALUES (?,?,?,?,?,?,?)",
        ("neuro", prompt, fractal_hash, i, response, time.time(), temp_factor)
    )
conn.commit()
print(f"[PY] Qbit stored -> {fractal_hash[:8]}")
