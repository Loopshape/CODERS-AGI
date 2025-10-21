#!/usr/bin/env python3
import sys, os, sqlite3, hashlib, time
PROMPT = " ".join(sys.argv[1:]) or input("Enter human prompt: ")

DB_FILE = os.path.expanduser("./memory.db")
conn = sqlite3.connect(DB_FILE)
c = conn.cursor()

# Create table if not exists
c.execute("""
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
""")
conn.commit()

FRACTAL_HASH = hashlib.sha256(PROMPT.encode()).hexdigest()
TEMP_FACTOR = 0.5
ITERATIONS = 5

for i in range(1, ITERATIONS+1):
    response = f"Neuro reasoning cycle {i} for prompt '{PROMPT}'"
    c.execute(
        "INSERT INTO qbits (agent,prompt,hash,iteration,response,timestamp,temp) VALUES (?,?,?,?,?,?,?)",
        ("neuro", PROMPT, FRACTAL_HASH, i, response, time.time(), TEMP_FACTOR)
    )
    conn.commit()
    print(f"[PY] Qbit stored -> {FRACTAL_HASH[:8]} : {response}")
