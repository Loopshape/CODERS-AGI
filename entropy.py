#!/bin/python3
import hashlib
import random
import time
import sqlite3
import json
import os
from typing import List, Dict, Any
from dataclasses import dataclass
import threading
from contextlib import contextmanager

# -----------------------------
# Enhanced Config
# -----------------------------
CHARSET_2K = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[:2048]
DB_FILE = "qbit_memory.db"
JSON_DIR = "qbit_json"
MAX_MNEMONIC_LENGTH = 64

os.makedirs(JSON_DIR, exist_ok=True)

# -----------------------------
# Data Classes for Type Safety
# -----------------------------
@dataclass
class QbitData:
    index: int
    timestamp: int
    agents: List[int]
    hash: str
    mnemonic: str
    tokens: List[str]

# -----------------------------
# Enhanced Tokenization
# -----------------------------
class OllamaTokenizer:
    @staticmethod
    def tokenize(text: str, chunk_size: int = 4) -> List[str]:
        """More sophisticated tokenization simulation"""
        if not text:
            return []
        
        # Split into chunks, but also create some semantic-like tokens
        chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
        
        # Add some variation to simulate NLP token patterns
        if len(chunks) > 1:
            # Occasionally combine adjacent chunks
            if random.random() < 0.3:
                combined = chunks[:2]
                chunks = [''.join(combined)] + chunks[2:]
        
        return chunks

# -----------------------------
# Enhanced Entropy Sources
# -----------------------------
class EntropyManager:
    def __init__(self):
        self.entropy_sources = [
            self._system_entropy,
            self._time_entropy,
            self._process_entropy
        ]
    
    def _system_entropy(self) -> int:
        return random.getrandbits(32)
    
    def _time_entropy(self) -> int:
        return int(time.time() * 1_000_000) % (2**32)
    
    def _process_entropy(self) -> int:
        return hash(str(threading.get_ident())) % (2**32)
    
    def get_agent_entropy(self, num_agents: int = 5) -> List[int]:
        """Get entropy from multiple sources"""
        agents = []
        for i in range(num_agents):
            source = self.entropy_sources[i % len(self.entropy_sources)]
            agents.append(source())
        return agents

# -----------------------------
# Enhanced Qbit Class
# -----------------------------
class Qbit:
    def __init__(self, prev_hash: str, agents: List[int], index: int, 
                 charset: str = CHARSET_2K, tokenizer=None):
        self.index = index
        self.timestamp = self._get_precise_timestamp()
        self.agents = agents
        self.prev_hash = prev_hash
        self.hash = self.rehash(prev_hash)
        self.mnemonic = self.map_to_charset(charset)
        self.tokenizer = tokenizer or OllamaTokenizer()
        self.tokens = self.tokenizer.tokenize(self.mnemonic)
    
    def _get_precise_timestamp(self) -> int:
        """Get timestamp with microsecond precision"""
        return int(time.time() * 1_000_000)
    
    def rehash(self, prev_hash: str) -> str:
        """Create cryptographic hash chain"""
        combined = (
            f"{prev_hash}"
            f"{self.timestamp}"
            f"{self.index}"
            f"{''.join(str(a) for a in self.agents)}"
        ).encode()
        return hashlib.sha256(combined).hexdigest()
    
    def map_to_charset(self, charset: str) -> str:
        """Map hash to human-readable mnemonic"""
        result = []
        hash_bytes = self.hash.encode()
        
        for i in range(0, min(len(hash_bytes), MAX_MNEMONIC_LENGTH)):
            # Use different parts of hash for variety
            if i % 2 == 0:
                val = hash_bytes[i] ^ hash_bytes[(i + 1) % len(hash_bytes)]
            else:
                val = (hash_bytes[i] + i) % 256
            
            result.append(charset[val % len(charset)])
        
        return ''.join(result)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "prev_hash": self.prev_hash,
            "agents": self.agents,
            "hash": self.hash,
            "mnemonic": self.mnemonic,
            "tokens": self.tokens,
            "token_count": len(self.tokens)
        }
    
    def validate(self) -> bool:
        """Validate Qbit integrity"""
        if not all(isinstance(agent, int) for agent in self.agents):
            return False
        if len(self.hash) != 64:  # SHA-256 should be 64 chars
            return False
        return True

# -----------------------------
# Enhanced Memory Management
# -----------------------------
class QbitMemory:
    def __init__(self, db_file: str = DB_FILE):
        self.db_file = db_file
        self.conn = sqlite3.connect(db_file, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._create_tables()
        self._create_indexes()
    
    def _create_tables(self):
        """Create optimized tables with proper constraints"""
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS qbits (
                idx INTEGER PRIMARY KEY,
                timestamp INTEGER NOT NULL,
                prev_hash TEXT NOT NULL,
                hash TEXT UNIQUE NOT NULL,
                mnemonic TEXT NOT NULL,
                tokens TEXT NOT NULL,
                agents TEXT NOT NULL,
                token_count INTEGER NOT NULL
            )
        ''')
        
        # Table for analytics
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS qbit_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER,
                qbit_count INTEGER,
                avg_token_count REAL
            )
        ''')
        self.conn.commit()
    
    def _create_indexes(self):
        """Create indexes for faster queries"""
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_timestamp ON qbits(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_hash ON qbits(hash)",
            "CREATE INDEX IF NOT EXISTS idx_metrics_time ON qbit_metrics(timestamp)"
        ]
        
        for index_sql in indexes:
            self.conn.execute(index_sql)
        self.conn.commit()
    
    @contextmanager
    def transaction(self):
        """Context manager for transactions"""
        try:
            yield
            self.conn.commit()
        except Exception:
            self.conn.rollback()
            raise
    
    def store_qbit(self, qbit: Qbit):
        """Store Qbit with transaction support"""
        with self.transaction():
            self.conn.execute('''
                INSERT INTO qbits 
                (idx, timestamp, prev_hash, hash, mnemonic, tokens, agents, token_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                qbit.index,
                qbit.timestamp,
                qbit.prev_hash,
                qbit.hash,
                qbit.mnemonic,
                json.dumps(qbit.tokens),
                json.dumps(qbit.agents),
                len(qbit.tokens)
            ))
    
    def get_qbit(self, index: int) -> Dict[str, Any]:
        """Retrieve Qbit by index"""
        cursor = self.conn.execute('''
            SELECT * FROM qbits WHERE idx = ?
        ''', (index,))
        row = cursor.fetchone()
        return dict(row) if row else None
    
    def get_recent_qbits(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most recent Qbits"""
        cursor = self.conn.execute('''
            SELECT * FROM qbits ORDER BY timestamp DESC LIMIT ?
        ''', (limit,))
        return [dict(row) for row in cursor.fetchall()]
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

# -----------------------------
# Enhanced JSON Management
# -----------------------------
class QbitJSONManager:
    def __init__(self, json_dir: str = JSON_DIR):
        self.json_dir = json_dir
        os.makedirs(json_dir, exist_ok=True)
    
    def save_qbit(self, qbit: Qbit):
        """Save Qbit as JSON with pretty formatting"""
        path = os.path.join(self.json_dir, f"qbit_{qbit.index:06d}.json")
        with open(path, "w", encoding='utf-8') as f:
            json.dump(qbit.to_dict(), f, indent=2, ensure_ascii=False)
    
    def load_qbit(self, index: int) -> Dict[str, Any]:
        """Load Qbit from JSON file"""
        path = os.path.join(self.json_dir, f"qbit_{index:06d}.json")
        try:
            with open(path, "r", encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return None

# -----------------------------
# Stream Manager with Monitoring
# -----------------------------
class QbitStreamManager:
    def __init__(self, genesis_hash: str):
        self.genesis_hash = genesis_hash
        self.current_hash = genesis_hash
        self.memory = QbitMemory()
        self.json_manager = QbitJSONManager()
        self.entropy_manager = EntropyManager()
        self.is_running = False
        self.total_qbits = 0
    
    def run_stream(self, interval: float = 1.0, max_iter
