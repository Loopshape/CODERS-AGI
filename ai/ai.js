#!/usr/bin/env node
/**
 * ai.js - Node.js ES module stub for Crew-AI
 * Streams AI responses and logs to console with colors
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import fetch from 'node-fetch'; // or global fetch in Node 18+
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const crewAgents = ['core', 'loop', 'code', 'coin', '2244', 'neuro'];
const modelMap = {
  core: 'core:latest',
  loop: 'loop:latest',
  code: 'code:latest',
  coin: 'coin:latest',
  '2244': '2244:latest',
  neuro: 'gemma3:1b'
};

async function streamAgent(agent, prompt) {
  const model = modelMap[agent];
  console.log(chalk.cyan(`[${agent.toUpperCase()}] 🚀 Starting stream...`));

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: true })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) console.log(chalk.green(`[${agent}] ${data.response}`));
        } catch (e) {}
      }
    }
    console.log(chalk.cyan(`[${agent}] ✅ Stream ended.`));
  } catch (err) {
    console.log(chalk.red(`[${agent}] ❌ Error: ${err.message}`));
  }
}

async function main() {
  const prompt = process.argv.slice(2).join(' ');
  if (!prompt) {
    console.log(chalk.yellow('⚠ Usage: ai.js "<prompt>"'));
    process.exit(1);
  }

  console.log(chalk.magenta(`[NEXUS] ⚙️ Generated entropy hash: ${Date.now().toString(16)}`));

  const streams = crewAgents.map(agent => streamAgent(agent, prompt));
  await Promise.allSettled(streams);

  console.log(chalk.magenta('[NEXUS] ✅ All streams completed.'));
  // Optional: store JSON/qbit to tmp
  const filename = path.join(tmpDir, `${Date.now().toString(16)}.json`);
  fs.writeFileSync(filename, JSON.stringify({ prompt, timestamp: Date.now(), agents: crewAgents }));
  console.log(chalk.green(`[JS] Crew-AI stub written to ${filename}`));
}

main();
