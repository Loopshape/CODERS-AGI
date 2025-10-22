#!/bin/python3
import hashlib
import random
import time
import threading

# -----------------------------
# Config: 2k-character charset
# -----------------------------
CHARSET_2K = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[:2048]  # placeholder 2k

# -----------------------------
# Agent entropy simulation
# -----------------------------
def agent_entropy():
    return random.getrandbits(64)

# -----------------------------
# Qbit class
# -----------------------------
class Qbit:
    def __init__(self, prev_hash, agents, index, charset):
        self.index = index
        self.timestamp = int(time.time() * 1000)  # ms
        self.agents = agents
        self.hash = self.rehash(prev_hash)
        self.mnemonic = self.map_to_charset(charset)

    def rehash(self, prev_hash):
        combined = f"{prev_hash}{self.timestamp}{self.index}{''.join(str(a) for a in self.agents)}".encode()
        return hashlib.sha256(combined).hexdigest()

    def map_to_charset(self, charset):
        result = []
        for i in range(0, len(self.hash), 4):
            val = int(self.hash[i:i+4], 16)
            result.append(charset[val % len(charset)])
        return ''.join(result)

# -----------------------------
# Qbit Stream Generator (Daemon)
# -----------------------------
class QbitStream:
    def __init__(self, charset=CHARSET_2K, interval_ms=1000):
        self.charset = charset
        self.interval = interval_ms / 1000  # convert to seconds
        self.prev_hash = self.genesis()
        self.index = 0
        self.running = False

    def genesis(self):
        agents = [agent_entropy() for _ in range(5)]
        combined = "".join(str(a) for a in agents).encode()
        return hashlib.sha256(combined).hexdigest()

    def start(self):
        self.running = True
        threading.Thread(target=self._loop, daemon=True).start()

    def stop(self):
        self.running = False

    def _loop(self):
        while self.running:
            agents = [agent_entropy() for _ in range(5)]
            self.index += 1
            qbit = Qbit(self.prev_hash, agents, self.index, self.charset)
            self.prev_hash = qbit.hash
            # Output for demonstration (could be sent to Ollama token remap)
            print(f"[Qbit {self.index}] Timestamp: {qbit.timestamp} | Mnemonic preview: {qbit.mnemonic[:16]}...")
            time.sleep(self.interval)

# -----------------------------
# Example usage
# -----------------------------
if __name__ == "__main__":
    stream = QbitStream(interval_ms=1000)  # generate a new qbit every 1 second
    stream.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        stream.stop()
        print("Qbit stream stopped.")
