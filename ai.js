#!/usr/bin/env node
// ~/_/ai/ai.js
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const PROMPT = process.argv.slice(2).join(' ');
if (!PROMPT) {
    console.log(chalk.red("No prompt given!"));
    process.exit(1);
}

const tmpDir = path.resolve(process.env.HOME, "__ai_tmp");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const hash = require('crypto').createHash('sha256').update(PROMPT).digest('hex');
const filename = path.join(tmpDir, `${hash}_js.json`);

fs.writeFileSync(filename, JSON.stringify({ prompt: PROMPT, hash }, null, 2));
console.log(chalk.green("[JS] Crew-AI stub written to " + filename));
