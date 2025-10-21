import sys, hashlib, sqlite3, json, time, os
prompt = sys.argv[1]
hashv = sys.argv[2]
db_path = os.path.expanduser("~/_.ai/db/qbits.db")
os.makedirs(os.path.dirname(db_path), exist_ok=True)
conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("CREATE TABLE IF NOT EXISTS qbits (hash TEXT, prompt TEXT, ts REAL)")
c.execute("INSERT INTO qbits VALUES (?,?,?)", (hashv, prompt, time.time()))
conn.commit()
print(f"[PY] Qbit stored -> {hashv[:8]}")
conn.close()
