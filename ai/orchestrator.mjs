#!/usr/bin/env node
// orchestrator.mjs v38 — Neuro-Orchestration Core
// Part of NEXUS stack — integrates ai.py, ai.js, and Ollama bridge logic
// Manages entropy flow, qbit aggregation, and JSON reflection to host dashboard

import fs from "fs";
import { spawn } from "child_process";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import os from "os";

const BASE_DIR = path.join(os.homedir(), "_/ai");
const TMP_DIR = path.join(BASE_DIR, "tmp");
const DB_FILE = path.join(BASE_DIR, "db/qbits.db");

await fs.promises.mkdir(TMP_DIR, { recursive: true });

// --- Configurable Parameters ---
const TEMP_FACTOR = parseFloat(process.env.TEMP_FACTOR || "0.5");
const RECUR_DEPTH = parseInt(process.env.RECUR_DEPTH || "5");
const CLOUD_MODEL = "deepseek-v3.1:671b-cloud";
const LOCAL_MODELS = ["core", "loop", "2244", "coin", "code"];

// --- Utility ---
const log = (msg) => console.log(`[ORCH] ${msg}`);
const now = () => new Date().toISOString();
const genHash = (input) =>
  crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);

// --- SQLite setup ---
const db = await open({
  filename: DB_FILE,
  driver: sqlite3.Database,
});

await db.exec(`
CREATE TABLE IF NOT EXISTS qbits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT,
    prompt TEXT,
    hash TEXT,
    iteration INTEGER,
    response TEXT,
    timestamp REAL,
    temp REAL
)
`);

// --- Core Function ---
async function runOrchestrator(prompt) {
  const entropyHash = genHash(`${prompt}-${Date.now()}`);
  log(`🧠 Initiating multi-agent orchestration for: "${prompt}"`);
  log(`🔑 Entropy hash: ${entropyHash}`);

  const neuroFile = path.join(TMP_DIR, `neuro_${Date.now()}.json`);
  const results = [];

  // --- Spawn Neuro (Python) ---
  const neuro = spawn("python3", [
    path.join(BASE_DIR, "ai.py"),
    prompt,
    entropyHash,
    TEMP_FACTOR.toString(),
    RECUR_DEPTH.toString(),
  ]);
  neuro.stdout.on("data", (d) => process.stdout.write(`[NEURO] ${d}`));
  neuro.stderr.on("data", (d) => process.stderr.write(`[NEURO-ERR] ${d}`));
  const neuroDone = new Promise((res) => neuro.on("exit", res));

  // --- Spawn Node crew models ---
  const crewDone = Promise.all(
    LOCAL_MODELS.map(
      (model) =>
        new Promise((res) => {
          const proc = spawn("node", [path.join(BASE_DIR, "ai.js"), prompt, model]);
          proc.stdout.on("data", (d) => process.stdout.write(`[${model}] ${d}`));
          proc.stderr.on("data", (d) => process.stderr.write(`[${model}-ERR] ${d}`));
          proc.on("exit", res);
        })
    )
  );

  // --- Spawn Deepseek cloud bridge ---
  const cloudDone = new Promise((res) => {
    const curl = spawn("curl", [
      "-s",
      "-N",
      "-X",
      "POST",
      "http://localhost:11434/api/generate",
      "-H",
      "Content-Type: application/json",
      "-d",
      JSON.stringify({
        model: CLOUD_MODEL,
        prompt,
        stream: true,
      }),
    ]);
    curl.stdout.on("data", (d) => process.stdout.write(`[CLOUD] ${d}`));
    curl.stderr.on("data", (d) => process.stderr.write(`[CLOUD-ERR] ${d}`));
    curl.on("exit", res);
  });

  await Promise.all([neuroDone, crewDone, cloudDone]);
  log("✅ All subprocesses complete.");

  // --- Gather DB reflection ---
  const rows = await db.all("SELECT * FROM qbits ORDER BY id DESC LIMIT 100");
  const reflection = {
    timestamp: now(),
    prompt,
    entropyHash,
    temp: TEMP_FACTOR,
    depth: RECUR_DEPTH,
    agents: [...LOCAL_MODELS, "neuro", "cloud"],
    total_qbits: rows.length,
    last_qbits: rows,
  };

  fs.writeFileSync(
    path.join(TMP_DIR, "reflection.json"),
    JSON.stringify(reflection, null, 2)
  );

  log("🧩 Reflection written → tmp/reflection.json");
  log("🧬 Qbit memory synchronized with SQLite3 and JSON bus.");
  return reflection;
}

// --- CLI Entry ---
const prompt = process.argv.slice(2).join(" ") || "default cognitive sync";
const result = await runOrchestrator(prompt);

log(`✨ Orchestration cycle finished @ ${now()}`);
log(JSON.stringify(result, null, 2));
process.exit(0);
