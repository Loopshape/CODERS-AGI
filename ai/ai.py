#!/usr/bin/env python3
import sys, os, json, sqlite3, hashlib, time

prompt = sys.argv[1]
hash_val = sys.argv[2]
db_file = sys.argv[3]
tmp_dir = sys.argv[4]

# Connect SQLite
conn = sqlite3.connect(db_file)
c = conn.cursor()
c.execute("""CREATE TABLE IF NOT EXISTS qbits (id INTEGER PRIMARY KEY, agent TEXT, hash TEXT, output TEXT)""")

# Example: process prompt
agents = ['core','loop','code','coin','2244','neuro']
for agent in agents:
    output = f"{agent} processed: {prompt} [{hash_val[:8]}]"
    # Store qbit
    c.execute("INSERT INTO qbits(agent, hash, output) VALUES (?,?,?)", (agent, hash_val, output))
    # Store JSON
    tmp_file = os.path.join(tmp_dir, f"{hash_val}_{agent}.json")
    with open(tmp_file,'w') as f: json.dump({'agent':agent,'output':output}, f)

conn.commit()
conn.close()
print("[PY] Qbits processed & JSON stored.")
