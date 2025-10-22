#!/usr/bin/env node
// ai.js v38 — Crew AI Node Agent
// Spawns Ollama local model inference for each AI personality (core, loop, 2244, coin, code)
// Streams JSON response for orchestrator.mjs and ai.sh pipelines.

import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const BASE = `${os.homedir()}/_/ai`;
const TMP_DIR = `${BASE}/tmp`;
const DB_FILE = `${BASE}/db/qbits.db`;

const prompt = process.argv[2] || "no prompt";
const agent = process.argv[3] || "core";
const timestamp = new Date().toISOString();

// Ensure dirs
fs.mkdirSync(TMP_DIR, { recursive: true });
fs.mkdirSync(`${BASE}/db`, { recursive: true });

// SQLite connect
const db = await open({
  filename: DB_FILE,
  driver: sqlite3.Database
});
await db.exec(`
  CREATE TABLE IF NOT EXISTS qbits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT,
    prompt TEXT,
    response TEXT,
    timestamp TEXT
  );
`);

const outfile = path.join(TMP_DIR, `${agent}_${Date.now()}.json`);

// --- Stream helper ---
async function runOllama(agent, prompt) {
  return new Promise((resolve) => {
    const proc = spawn("ollama", ["run", agent], { stdio: ["pipe", "pipe", "pipe"] });
    let buffer = "";

    proc.stdout.on("data", (d) => {
      buffer += d.toString();
      process.stdout.write(`[${agent}] ${d}`);
    });
    proc.stderr.on("data", (d) => process.stderr.write(`[${agent}-err] ${d}`));

    proc.on("close", () => {
      resolve(buffer.trim());
    });

    proc.stdin.write(prompt + "\n");
    proc.stdin.end();
  });
}

// --- Main logic ---
(async () => {
  console.log(`[${agent}] 🚀 Starting stream...`);
  const response = await runOllama(agent, prompt);

  await fs.promises.writeFile(outfile, JSON.stringify({ agent, prompt, response, timestamp }, null, 2));

  await db.run(
    `INSERT INTO qbits (agent, prompt, response, timestamp) VALUES (?,?,?,?);`,
    [agent, prompt, response, timestamp]
  );

  console.log(`[${agent}] ✅ Stream ended. JSON stored -> ${outfile}`);
})();
