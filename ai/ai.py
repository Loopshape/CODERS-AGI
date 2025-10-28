# ai.py – File operations + pipeline trigger backend (Python)
import argparse
import os
import sqlite3
import subprocess
import sys

DB_PATH = os.path.expanduser("~/_/.ai_platform/core.db")
LOG_PATH = os.path.expanduser("~/_/.ai_platform/ai.log")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mindflow(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        prompt_hash TEXT,
        loop_number INTEGER,
        model_name TEXT,
        output_text TEXT,
        ranking_score REAL,
        language TEXT,
        mood_context TEXT
    );
    """)
    conn.commit()
    conn.close()

def refine_file(file_path):
    if not os.path.isfile(file_path):
        print(f"Error: File not found: {file_path}", file=sys.stderr)
        sys.exit(1)
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    # Call the JS module for pipeline
    result = subprocess.run(["node", "ai.js", "refine", "--file", file_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        print("JS pipeline error:", result.stderr, file=sys.stderr)
        sys.exit(1)
    # Expect JS to output new content
    new_content = result.stdout
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"✅ Refined file: {file_path}")

def show_status():
    print("Version: 1.2.0")
    print(f"Database path: {DB_PATH}")
    # Add more status logic

def show_logs(limit):
    if not os.path.isfile(LOG_PATH):
        print("No log file found.")
        return
    with open(LOG_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()[-int(limit):]
    for line in lines:
        print(line.rstrip())

def main():
    init_db()
    parser = argparse.ArgumentParser(prog="ai.py")
    sub = parser.add_subparsers(dest="cmd")

    p_refine = sub.add_parser("refine")
    p_refine.add_argument("file")

    p_status = sub.add_parser("status")

    p_logs = sub.add_parser("logs")
    p_logs.add_argument("--limit", type=int, default=10)

    args = parser.parse_args()
    if args.cmd == "refine":
        refine_file(args.file)
    elif args.cmd == "status":
        show_status()
    elif args.cmd == "logs":
        show_logs(args.limit)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
