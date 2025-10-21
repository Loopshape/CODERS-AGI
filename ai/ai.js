#!/usr/bin/env node
// ai.js - Node.js Crew AI Orchestrator

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const AGENTS = ['core','loop','code','coin','2244'];
const CREW_POOL = 'deepseek-coder:latest';
const LOCAL_API = 'http://localhost:11434/api/generate';

function saveJSON(agent, data) {
    const filename = path.join(TMP_DIR, `${agent}_${Date.now().toString(16)}.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(chalk.green(`[JS] Crew-AI stub written to ${filename}`));
}

async function streamAgent(agent, prompt) {
    console.log(chalk.cyan(`[${agent.toUpperCase()}] 🚀 Starting stream...`));
    try {
        const res = await fetch(LOCAL_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: agent, prompt, stream: true })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.trim());
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.response) {
                        console.log(chalk.blue(`[${agent}] ${data.response}`));
                        fullResponse += data.response + '\n';
                    }
                } catch {}
            }
        }
        saveJSON(agent, { prompt, response: fullResponse });
        console.log(chalk.cyan(`[${agent}] ✅ Stream ended.`));
    } catch (e) {
        console.log(chalk.red(`[${agent}] ❌ Error: ${e.message}`));
    }
}

async function streamCrewPool(prompt) {
    const agent = 'Crew-AI';
    console.log(chalk.cyan(`[${agent}] 🚀 Starting stream...`));
    try {
        const res = await fetch(LOCAL_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: CREW_POOL, prompt, stream: true })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.trim());
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.response) {
                        console.log(chalk.magenta(`[${agent}] ${data.response}`));
                        fullResponse += data.response + '\n';
                    }
                } catch {}
            }
        }
        saveJSON(agent, { prompt, response: fullResponse });
        console.log(chalk.cyan(`[${agent}] ✅ Crew-Pool stream ended.`));
    } catch (e) {
        console.log(chalk.red(`[${agent}] ❌ Error: ${e.message}`));
    }
}

// CLI
(async () => {
    const prompt = process.argv.slice(2).join(' ');
    if (!prompt) {
        console.log(chalk.yellow('Usage: node ai.js "<prompt>"'));
        process.exit(1);
    }

    const streams = AGENTS.map(agent => streamAgent(agent, prompt));
    streams.push(streamCrewPool(prompt));
    await Promise.all(streams);
    console.log(chalk.green('[JS] ✅ All streams completed.'));
})();
