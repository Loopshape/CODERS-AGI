#!/usr/bin/env python3
import sqlite3, json, hashlib, time, statistics, os, math

DB_FILE = os.path.expanduser("~/_/qbits.db")

def entropy(text):
    """Estimate informational entropy of a text."""
    if not text:
        return 0
    freq = {c: text.count(c) for c in set(text)}
    total = len(text)
    return -sum((count/total) * math.log2(count/total) for count in freq.values())

def analyze_latest_cycle():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("SELECT hash FROM qbits ORDER BY id DESC LIMIT 5")
    hashes = [r[0] for r in cur.fetchall()]
    if not hashes:
        print("[Reflect] ⚠️ No qbits yet.")
        return

    last_hash = hashes[-1]
    cur.execute("SELECT agent, response FROM qbits WHERE hash=?", (last_hash,))
    rows = cur.fetchall()
    conn.close()

    print(f"[Reflect] 🔄 Analyzing cycle {last_hash[:8]} across {len(rows)} agents...")

    entropy_map = {}
    for agent, response in rows:
        e = entropy(response)
        entropy_map[agent] = e
        print(f"  • {agent:<7} entropy = {e:.3f}")

    # Normalize entropies → dynamic balance coefficient
    avg = statistics.mean(entropy_map.values())
    variance = statistics.pstdev(entropy_map.values())
    coherence = 1 / (1 + variance)  # lower variance = higher coherence

    reflection = {
        "hash": last_hash,
        "timestamp": time.time(),
        "avg_entropy": avg,
        "coherence": coherence,
        "agent_entropy": entropy_map,
        "recommendations": {
            "temperature": min(1.0, max(0.1, avg / 8)),
            "iterations": int(3 + (1 - coherence) * 4),
        }
    }

    out = os.path.expanduser("~/_/ai/.reflect.json")
    with open(out, "w") as f:
        json.dump(reflection, f, indent=2)
    print("[Reflect] 🧩 Updated Neuro tuning written to .reflect.json")
    print(json.dumps(reflection["recommendations"], indent=2))

if __name__ == "__main__":
    analyze_latest_cycle()
