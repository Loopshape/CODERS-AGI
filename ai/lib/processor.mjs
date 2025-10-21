#!/usr/bin/env node
// processor.mjs
// Reads JSON from stdin and outputs JSON to stdout with modifications
// Implements simple fractal-style prompt expansion and math-based tuning

import readline from 'readline';

function hashString(s){
  // simple hash (FNV-like)
  let h = 2166136261 >>> 0;
  for(let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0).toString(16);
}

function fractalExpand(prompt, iterations){
  // create a fractal-like expansion: iterate, transform by golden ratio scaling and simple math
  const GOLD = 1.6180339887498948;
  let parts = [prompt];
  for(let i=1;i<Math.max(1, iterations); i++){
    const scale = (GOLD * i) % 1;
    // embed partial transformations to create 'self-similar' context
    const transform = `${prompt} -- fractal#${i} scale=${scale.toFixed(4)} epoch=${Date.now()}`;
    parts.push(transform);
  }
  return parts.join("\n\n");
}

function applyMathLaws(prompt, temp, iterations){
  // derive a numeric seed and append analytic hints
  const seed = parseInt(hashString(prompt).slice(0,8), 16) || 1;
  const adjustment = (temp - 0.5) * 2; // [-1,1] influence
  const numericHint = `// seed:${seed} adj:${adjustment.toFixed(3)} iter:${iterations}`;
  const expanded = fractalExpand(prompt, iterations);
  return {prompt: `${numericHint}\n\n${expanded}`, meta:{seed, adjustment, iterations}};
}

// read stdin
const rl = readline.createInterface({ input: process.stdin, terminal: false });
let data = '';
rl.on('line', (line) => { data += line + '\n'; });
rl.on('close', () => {
  try {
    const input = JSON.parse(data || '{}');
    const prompt = input.prompt || '';
    const temp = Number(input.temp || 0.7);
    const iterations = Number(input.iterations || 1);
    const res = applyMathLaws(prompt, temp, iterations);
    console.log(JSON.stringify({ ok: true, processedPrompt: res.prompt, meta: res.meta }));
  } catch (e) {
    console.error(JSON.stringify({ ok:false, error: e.message }));
    process.exit(1);
  }
});
