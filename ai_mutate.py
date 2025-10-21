#!/usr/bin/env python3
import sys, sqlite3, json, random

human_prompt = sys.argv[1]
db_file = f"{__import__('os').path.expanduser('~/_/ai/memory/memory.db')}"
conn = sqlite3.connect(db_file)
c = conn.cursor()
c.execute("SELECT json FROM qbits ORDER BY weight DESC LIMIT 5")
top_qbits = c.fetchall()

mutations = []
for q in top_qbits:
    data = json.loads(q[0])
    if "prompt" in data:
        words = data["prompt"].split()
        random.shuffle(words)
        mutations.append(" ".join(words))

if not mutations:
    mutations.append(human_prompt)

print(random.choice(mutations))
conn.close()
