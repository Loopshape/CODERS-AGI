#!/usr/bin/env python3
import os
import subprocess
import json
import hashlib
import sqlite3
import datetime
import zlib
import re
import argparse
import logging
import sys
import requests
import random
import time
from flask import Flask, request, jsonify # NEW DEPENDENCIES

# --- Configuration ---
VERSION = "4.1.0"
AUTHOR = "Nemodian 2244-1"
API_PORT = 3000

# Database paths (UPDATED DB_DIR)
DB_DIR = os.path.expanduser("~/_/.ai_platform")
CORE_DB = os.path.join(DB_DIR, "core.db")
SWAP_DIR = os.path.join(DB_DIR, "swap")
LOG_FILE = os.path.join(DB_DIR, "ai.log")
OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "deepseek-v3.1:671b-cloud"
GENESIS_HASH_FILE = os.path.join(DB_DIR, "genesis.hash")

# Agent Manifest: Updated roles
AGENT_MANIFEST = {
    "code": "ALGORITHMICAL: Provide expressive, fully detailed analysis with comprehensive code examples and deep technical background.",
    "coin": "BIOLOGICAL: Offer extensive, emotionally and contextually rich analysis, detailing mood shifts and historical significance.",
    "2244": "CHEMICAL: Deliver exhaustive multilingual responses, deeply exploring cultural and linguistic nuances in both German and English.",
    "core": "PHYSICAL: Present an in-depth, structured decomposition of the problem, detailing every logical step and counter-argument considered.",
    "loop": "LOGICAL: Generate lengthy, refined answers that fully articulate the synthesis process and justify every decision through exhaustive feedback integration."
}

# --- Logging Setup ---
os.makedirs(DB_DIR, exist_ok=True)
os.makedirs(SWAP_DIR, exist_ok=True)
logging.basicConfig(filename=LOG_FILE, level=logging.INFO,
                    format='[%(asctime)s] [%(levelname)s] %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S')

def log_event(level, message):
    """Logs an event to the console and the log file."""
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_message = f"[{timestamp}] [{level.upper()}] {message}"
    print(log_message)
    logging.info(log_message)

# --- Database Initialization (Retained for completeness) ---
def init_database():
    conn = sqlite3.connect(CORE_DB)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mindflow (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        prompt_hash TEXT, loop_number INTEGER, model_name TEXT,
        output_text TEXT, ranking_score REAL, language TEXT, mood_context TEXT
    );
    """)
    conn.commit()
    conn.close()
    log_event("SYSTEM", f"Database initialized at {CORE_DB}")

# --- Utility Functions ---
def hash_string(s):
    return hashlib.sha256(s.encode('utf-8')).hexdigest()

def get_genesis_hash():
    if os.path.exists(GENESIS_HASH_FILE):
        with open(GENESIS_HASH_FILE, 'r') as f:
            return f.read().strip()
    return hash_string(f"GENESIS_{time.time()}") # Fallback

def assemble_prompt(prompt, context, model_type):
    agent_role = AGENT_MANIFEST.get(model_type, "You are a helpful AI.")
    return f"Original Prompt: {prompt}\nContext from previous iterations: {context}\nModel Role: {agent_role}\n\nPlease provide your analysis and reasoning.If you reach a definitive conclusion, mark it with [FINAL_ANSWER]."

def run_agent(agent_name, prompt, context):
    system_msg = AGENT_MANIFEST.get(agent_name, "You are a helpful AI.")
    # In a full Python script, we would use concurrent futures here.
    # For this simplified implementation, we make a synchronous API call.
    return call_ollama_api(system_msg, prompt, context, agent_name)

def call_ollama_api(system_message, prompt, context, model_type):
    full_prompt = assemble_prompt(prompt, context, model_type)
    
    payload = {
        "model": DEFAULT_MODEL, "system": system_message, "prompt": full_prompt,
        "stream": False, "options": {"temperature": 0.7, "top_p": 0.9, "top_k": 40}
    }
    
    try:
        response = requests.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        return data.get('response', 'API_ERROR')
    except requests.exceptions.RequestException as e:
        log_event("ERROR", f"Ollama API request failed: {e}")
        return generate_fallback_response(model_type)

def generate_fallback_response(model_type):
    # ... (Fallback logic translated from Bash script)
    return f"[FALLBACK] Agent {model_type} offline or API failed."

def build_context(outputs, loop_number):
    context = f"Previous loop {loop_number} outputs (Full Verbose Context):\n"
    for model_name, output in outputs.items():
        clean_output = output.replace("[FALLBACK]", "").strip()
        context += f"\n{model_name.upper()}: {clean_output[:300]}..."
    return context

def calculate_output_score(output, model_name):
    score = 0
    length = len(output.split())
    score += length * 50
    if "[FINAL_ANSWER]" in output:
        score += 5000
    base_weights = {"core": 1000, "loop": 900, "code": 800, "coin": 700, "2244": 600}
    score += base_weights.get(model_name, 500)
    if output.startswith("[FALLBACK]"):
        score -= 10000
    return score

# --- Core Reasoning Logic ---
# NOTE: This implementation is highly simplified and synchronous for demonstration.
# A true Python implementation would use concurrent.futures or asyncio for the agent race.
def autonomic_reasoning(prompt):
    max_loops = 5
    prompt_hash = hash_string(prompt)
    log_event("INFO", f"Starting ASP for prompt: {prompt[:50]}...")
    context = ""
    fused_output = ""
    
    # Pre-reasoning Context (Simulated)
    current_genesis_hash = get_genesis_hash()
    context = f"System Origin Hash (Origin-H): {current_genesis_hash[:10]}..."

    for loop in range(1, max_loops + 1):
        # 1. Execute Model Race (Simulated Sync/Sequential Execution)
        model_outputs = {}
        for agent_name in AGENT_MANIFEST:
            model_outputs[agent_name] = run_agent(agent_name, prompt, context)

        # 2. Score and Fuse
        scores = {name: calculate_output_score(out, name) for name, out in model_outputs.items()}
        fused_output = max(model_outputs.items(), key=lambda item: scores[item[0]])[1]

        # 3. Build Context
        context = build_context(model_outputs, loop)

        if "[FINAL_ANSWER]" in fused_output:
            break

    # Final cleanup and return
    return fused_output.replace("[FINAL_ANSWER]", "").strip()

# --- NEW: API Backend Logic (Flask) ---
app = Flask(__name__)

# Basic CORS setup to allow the web editor (localhost:any) to call the API
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.route('/api/reason', methods=['POST'])
def api_reason_endpoint():
    try:
        payload = request.get_json()
        prompt = payload.get('prompt', '')
        code_context = payload.get('context', '')

        if not prompt:
            log_event("API_ERROR", "Missing prompt in payload.")
            return jsonify({"error": "Missing prompt in payload."}), 400

        log_event("API", f"Processing Editor Payload. Prompt: {prompt[:50]}...")
        
        # Determine the full prompt to send to the reasoning engine
        if "CODE_START" in prompt or "fix the syntax error" in prompt or "Critique and fix" in prompt:
            full_refine_prompt = f"{prompt}\n\nCODE TO BE REFINED:\n\n---\n{code_context}"
        else:
            full_refine_prompt = prompt

        # Run the core reasoning loop
        result = autonomic_reasoning(full_refine_prompt)
        
        # Process result for the Web Editor's expected JSON format
        code_match = re.search(r"\[FINAL_ANSWER\]CODE_START([\s\S]*?)CODE_END", result)
        
        if code_match:
            # Refinement Success
            response_data = {
                "suggested_code": code_match.group(1).strip(),
                "final_output": result
            }
        else:
            # General Synthesis Success
            response_data = {
                "final_output": result
            }

        return jsonify(response_data), 200

    except Exception as e:
        log_event("FATAL", f"API Runtime Error: {e}")
        return jsonify({"error": f"Internal Server Error: {e}"}), 500

# --- Main Entry Point ---
if __name__ == '__main__':
    # Initialize DB before starting server
    if not os.path.exists(CORE_DB):
        init_database()

    log_event("SYSTEM", f"Starting API Backend on port {API_PORT}...")
    print(f"\n\n🌐 Nemodian 2244-1 API Backend running at http://localhost:{API_PORT}")
    print("Dependencies: Flask, requests. Use: python3 ai.py to run.")
    
    # Run Flask server (in a production setting, this would use a WSGI server like Gunicorn)
    app.run(host='0.0.0.0', port=API_PORT, debug=False)
