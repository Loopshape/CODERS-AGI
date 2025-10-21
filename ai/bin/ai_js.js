const fs = require("fs");
const path = require("path");
const prompt = process.argv[2];
const hashv = process.argv[3];
const outfile = path.join(process.env.HOME, "_/ai/tmp", `${hashv}.json`);
const data = { prompt, hash: hashv, ts: Date.now() };
fs.writeFileSync(outfile, JSON.stringify(data, null, 2));
console.log(`[JS] Resonance stored: ${outfile}`);
