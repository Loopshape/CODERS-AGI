#!/usr/bin/env node
/**
 * orchestrator.mjs
 * AI Orchestrator: qbits ↔ JSON ↔ SQLite ↔ Ollama
 * Node.js ES module version
 */

import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { exec } from "child_process";
import chalk from "chalk";

const BASE_DIR = process.env.HOME + "/_/ai";
const TMP_DIR = path.join(BASE_DIR, "tmp");
const DB_PATH = path.join(BASE_DIR, "db/ai_memory.sqlite");

// Ensure TMP_DIR exists
fs.mkdirSync(TMP_DIR, { recursive: true });

// CLI args
const PROMPT = process.argv[2] || ".";
const TEMP = parseFloat(process.argv[3]) || 0.5;
const DEPTH = parseInt(process.argv[4]) || 5;

console.log(chalk.cyan(`[ORCHESTRATOR] Starting AI orchestration...`));
console.log(chalk.cyan(`[ORCHESTRATOR] Human prompt: "${PROMPT}" | Temp: ${TEMP} | Depth: ${DEPTH}`));

// Step 1: Run Python AI handler (qbits generator & Ollama)
await new Promise((resolve, reject) => {
  const py = exec(`python3 ${BASE_DIR}/ai.py "${PROMPT}" ${TEMP} ${DEPTH}`);
  py.stdout.pipe(process.stdout);
  py.stderr.pipe(process.stderr);
  py.on("exit", resolve);
});

// Step 2: Read SQLite memory & output JSON snapshot
const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
const qbits = await db.all("SELECT * FROM qbits");
const snapshotFile = path.join(TMP_DIR, "memory_snapshot.json");
fs.writeFileSync(snapshotFile, JSON.stringify(qbits, null, 2));
console.log(chalk.green(`[ORCHESTRATOR] JSON snapshot written to ${snapshotFile}`));
await db.close();

// Step 3: Agent processing (simulated DOM/DEX reflection)
console.log(chalk.yellow(`[AGENTS] Processing JSON nodes for agent reflection...`));
// Example: just iterate nodes
qbits.forEach((q, idx) => {
  console.log(chalk.magenta(`[AGENT-${idx}] Agent ${q.agent}, Qbit Hash: ${q.hash}`));
});

// Step 4: Neuro reasoning (iterational task)
console.log(chalk.blue(`[NEURO] Reading full mindmap for reasoning...`));
const neuroInstructions = qbits.map(q => ({
  agent: q.agent,
  promptSnippet: q.prompt?.slice(0, 50) || "",
  hash: q.hash,
}));
console.log(chalk.blue(`[NEURO] Neuro processed ${neuroInstructions.length} qbits.`));

console.log(chalk.cyan(`[ORCHESTRATOR] AI orchestration complete.`));
console.log(chalk.green(`[ORCHESTRATOR] JSON outputs stored in ${TMP_DIR}`));
