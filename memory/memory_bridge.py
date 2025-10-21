#!/usr/bin/env python3
import sqlite3, sys, json, hashlib, os, datetime
DB_FILE = os.path.expanduser(sys.argv[1])
action = sys.argv[2]
agent = sys.argv[3]
prompt = sys.argv[4] if len(sys.argv) > 4 else ""
qbit = sys.argv[5] if len(sys.argv) > 5 else "{}"

phash = hashlib.sha256(prompt.encode()).hexdigest()
conn = sqlite3.connect(DB_FILE)
c = conn.cursor()
c.execute('''CREATE TABLE IF NOT EXISTS qbits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    agent TEXT NOT NULL,
    prompt_hash TEXT NOT NULL,
    qbit TEXT NOT NULL
)''')
if action=="store":
    c.execute("INSERT INTO qbits (timestamp,agent,prompt_hash,qbit) VALUES (?,?,?,?)",
              (datetime.datetime.utcnow().isoformat(),agent,phash,qbit))
elif action=="fetch":
    c.execute("SELECT * FROM qbits WHERE agent=? AND prompt_hash=?", (agent,phash))
    rows = c.fetchall()
    print(json.dumps([{"id":r[0],"timestamp":r[1],"agent":r[2],"prompt_hash":r[3],"qbit":r[4]} for r in rows]))
conn.commit()
conn.close()
