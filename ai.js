// ai.js - Autonomic Synthesis Platform (ASP) - API Backend
// Multi-model reasoning framework with parallel execution and memory
// Version 4.1.0 - Node.js implementation of the Editor Backend Processor

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import util from 'util';
import process from 'process';
import zlib from 'zlib';
import http from 'http'; // Standard Node.js HTTP module
import url from 'url';

// FIX: Correct imports for CommonJS modules (Node-fetch, sqlite3)
import pkgSqlite3 from 'sqlite3';
const { Database } = pkgSqlite3; 

import pkgCommander from 'commander';
const { program } = pkgCommander;

import pkgFetch from 'node-fetch';
const fetch = pkgFetch.default || pkgFetch; 


// Promisify zlib and database methods
const deflatePromise = util.promisify(zlib.deflate);
const inflatePromise = util.promisify(zlib.inflate);

// Function to establish a new DB connection (safer for async/non-pooled access)
const getDbConnection = () => new Database(path.join(os.homedir(), '_/.ai_platform/core.db'));

// Correctly promisify the run method for the Database
const dbRun = util.promisify(getDbConnection().run).bind(getDbConnection()); 

// --- Configuration ---
const VERSION = "4.1.0";
const AUTHOR = "Nemodian 2244-1";
const API_PORT = 3000; // The port the web client (ai-editor.html) will call

// Database paths
const DB_DIR = path.join(os.homedir(), '_/.ai_platform');
const CORE_DB = path.join(DB_DIR, 'core.db');
const SWAP_DIR = path.join(DB_DIR, 'swap');
const LOG_FILE = path.join(DB_DIR, 'ai.log');
const OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'deepseek-v3.1:671b-cloud';

// Agent Manifest: Updated roles
const AGENT_MANIFEST = {
    "code": "ALGORITHMICAL: Provide expressive, fully detailed analysis with comprehensive code examples and deep technical background.",
    "coin": "BIOLOGICAL: Offer extensive, emotionally and contextually rich analysis, detailing mood shifts and historical significance.",
    "2244": "CHEMICAL: Deliver exhaustive multilingual responses, deeply exploring cultural and linguistic nuances in both German and English.",
    "core": "PHYSICAL: Present an in-depth, structured decomposition of the problem, detailing every logical step and counter-argument considered.",
    "loop": "LOGICAL: Generate lengthy, refined answers that fully articulate the synthesis process and justify every decision through exhaustive feedback integration."
};

// --- Initialization ---
// ... (init_database, log_event, hash_string, compress_store, etc. remain the same)
async function init_database() {
    await fs.mkdir(DB_DIR, { recursive: true });
    await fs.mkdir(SWAP_DIR, { recursive: true });

    const db = getDbConnection();
    const dbRunPromise = util.promisify(db.run).bind(db);

    await dbRunPromise(`
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
    `);
    db.close();
    await log_event("SYSTEM", `Database initialized at ${CORE_DB}`);
}

async function log_event(level, message) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
    try {
        await fs.appendFile(LOG_FILE, logMessage + '\n');
    } catch (e) { /* ignore */ }
}
function hash_string(s) {
    return createHash('sha256').update(s).digest('hex');
}
async function compress_store(content) {
    const hash = hash_string(content);
    const swap_file = path.join(SWAP_DIR, `${hash}.gz`);
    const compressed_content = await deflatePromise(content);
    await fs.writeFile(swap_file, compressed_content);
    return hash;
}
function generate_fallback_response(model_type) {
    let fallback_msg = "";
    if (model_type == "code") fallback_msg = "Technical analysis: Code Agent offline. The problem requires a systematic approach to algorithm design.";
    else if (model_type == "coin") fallback_msg = "Contextual analysis: Current systems offline. In such moments, reflection often reveals alternative perspectives worth exploring.";
    else if (model_type == "2244") fallback_msg = "Sprachanalyse derzeit nicht verfügbar. Fallback: Die Fragestellung erfordert weitere Betrachtung aus verschiedenen Blickwinkeln.";
    else if (model_type == "core") fallback_msg = "Core reasoning temporarily unavailable. Logical fallback: decompose problem into smaller subproblems and address each systematically.";
    else if (model_type == "loop") fallback_msg = "Iterative synthesis paused. Consider previous outputs and identify convergence patterns for optimal solution integration.";
    else fallback_msg = "Analysis unavailable. Please try again when AI systems are fully operational.";
    return `[FALLBACK] ${fallback_msg}`;
}
function assemble_prompt(prompt, context, model_type) {
    const role = AGENT_MANIFEST[model_type] || "You are a helpful AI.";
    return `Original Prompt: ${prompt}\nContext from previous iterations: ${context}\nModel Role: ${role}\n\nPlease provide your analysis and reasoning. If you reach a definitive conclusion, mark it with [FINAL_ANSWER].`;
}
function calculate_output_score(output, model_type) {
    let score = 0;
    const length = output.split(/\s+/).length;
    score += length * 50; 
    if (output.includes("[FINAL_ANSWER]")) { score += 5000; }
    const baseWeights = { core: 1000, loop: 900, code: 800, coin: 700, '2244': 600 };
    score += baseWeights[model_type] || 500;
    if (output.startsWith("[FALLBACK]")) { score -= 10000; }
    return score;
}
function rank_and_fuse_outputs(modelOutputs, loopNumber, promptHash) {
    const scores = {};
    const agentScores = Object.keys(modelOutputs).map(model_type => {
        const score = calculate_output_score(modelOutputs[model_type], model_type);
        scores[model_type] = score;
        return { model_type, score };
    });
    agentScores.sort((a, b) => b.score - a.score);
    const bestAgent = agentScores[0];
    return modelOutputs[bestAgent.model_type];
}
function build_context(outputs, loopNumber) {
    let context = `Previous loop ${loopNumber} outputs (Full Verbose Context):\n`;
    for (const model in outputs) {
        const output = outputs[model];
        const cleanOutput = output.replace('[FALLBACK]', '').trim();
        context += `\n${model.toUpperCase()}: ${cleanOutput.substring(0, 300)}...`;
    }
    return context;
}
async function call_ollama_model(system_message, prompt, context, model_type) {
    const full_prompt = assemble_prompt(prompt, context, model_type);
    const payload = { model: DEFAULT_MODEL, system: system_message, prompt: full_prompt, stream: false, options: { temperature: 0.7, top_p: 0.9, top_k: 40 } };
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), timeout: 60000
        });
        if (!response.ok) { throw new Error(`HTTP error! Status: ${response.status}`); }
        const data = await response.json();
        return data.response || generate_fallback_response(model_type);
    } catch (error) {
        await log_event('WARNING', `OLLAMA call for ${model_type} failed: ${error.message}. Using fallback.`);
        return generate_fallback_response(model_type);
    }
}
const agent_runners = {
    code: (p, c) => call_ollama_model(AGENT_MANIFEST.code, p, c, 'code'),
    coin: (p, c) => call_ollama_model(AGENT_MANIFEST.coin, p, c, 'coin'),
    '2244': (p, c) => call_ollama_model(AGENT_MANIFEST['2244'], p, c, '2244'),
    core: (p, c) => call_ollama_model(AGENT_MANIFEST.core, p, c, 'core'),
    loop: (p, c) => call_ollama_model(AGENT_MANIFEST.loop, p, c, 'loop'),
};
async function execute_model_race(prompt, context) {
    const promises = Object.keys(agent_runners).map(model_type => {
        return agent_runners[model_type](prompt, context)
            .then(output => ({ model_type, output }));
    });
    const resultsArray = await Promise.all(promises);
    const modelOutputs = {};
    resultsArray.forEach(res => { modelOutputs[res.model_type] = res.output; });
    return modelOutputs;
}
async function autonomic_reasoning(prompt) {
    let maxLoops = 5;
    const promptHash = hash_string(prompt);
    await log_event('INFO', `Starting 5-Agent Assembly for prompt: ${prompt.substring(0, 50)}...`);
    let context = '';
    let fusedOutput = ''; // Declare outside the loop

    for (let loop = 1; loop <= maxLoops; loop++) {
        const modelOutputs = await execute_model_race(prompt, context);
        fusedOutput = rank_and_fuse_outputs(modelOutputs, loop, promptHash);
        context = build_context(modelOutputs, loop);

        if (fusedOutput.includes("[FINAL_ANSWER]")) {
            break;
        }
        const displayFusedOutput = fusedOutput.replace('[FALLBACK]', '').replace('[FINAL_ANSWER]', '').trim();
        const wordCount = displayFusedOutput.split(/\s+/).length;
        if (wordCount < 300 && loop < maxLoops) { maxLoops++; }
    }
    return fusedOutput.replace('[FINAL_ANSWER]', '').trim();
}

//--- NEW: AI Editor API Processing Function ---
async function ai_process_editor_api(req, res) {
    const parsedUrl = url.parse(req.url);

    if (req.method !== 'POST' || parsedUrl.pathname !== '/api/reason') {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ error: 'Not Found or Invalid Method' }));
        return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });

    req.on('end', async () => {
        try {
            const payload = JSON.parse(body);
            const prompt = payload.prompt || '';
            const code_context = payload.context || '';

            if (!prompt) {
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ error: 'Missing prompt in payload.' }));
                return;
            }

            await log_event("API", `Processing Editor Payload. Prompt: ${prompt.substring(0, 50)}...`);
            
            let full_refine_prompt;

            // Check if this is a Code Refinement request (based on prompt keywords from ai-editor.html)
            if (prompt.includes("CODE_START") || prompt.includes("fix the syntax error") || prompt.includes("Critique and fix")) {
                // This is a refinement task. Embed the full context/code for the AI.
                full_refine_prompt = `${prompt}\n\nCODE TO BE REFINED:\n\n---\n${code_context}`;
            } else {
                // General synthesis/reasoning request
                full_refine_prompt = prompt;
            }
            
            const result = await autonomic_reasoning(full_refine_prompt);
            
            // Look for the code block markers in the result (from ai_refine_file logic)
            const codeMatch = result.match(/\[FINAL_ANSWER\]CODE_START([\s\S]*?)CODE_END/);
            
            let json_response = {};
            
            if (codeMatch) {
                // Refinement Success: Return clean code
                json_response = {
                    suggested_code: codeMatch[1].trim(),
                    final_output: result.replace(/\[FINAL_ANSWER\]/g, '').trim()
                };
            } else {
                // General Synthesis: Return full output
                json_response = {
                    final_output: result.replace(/\[FINAL_ANSWER\]/g, '').trim()
                };
            }

            res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}); // Allow CORS for web editor
            res.end(JSON.stringify(json_response));

        } catch (error) {
            await log_event("FATAL", `API Handler Error: ${error.message}`);
            res.writeHead(500, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
            res.end(JSON.stringify({ error: `Internal Server Error: ${error.message}` }));
        }
    });
}


// --- Main CLI/API Execution ---
async function cli_main() {
    // 1. Ensure Initialization
    await fs.mkdir(DB_DIR, { recursive: true });
    try {
        await fs.access(CORE_DB);
    } catch {
        await init_database();
    }
    
    // 2. Check for API Mode Launch (Only necessary if we were launching the API via a CLI command, 
    // but we'll assume direct Node launch for the server for simplicity).
    if (process.argv.includes('--api-server')) {
        await log_event("SYSTEM", `Starting API Backend on port ${API_PORT}...`);
        const server = http.createServer(ai_process_editor_api);
        server.listen(API_PORT, () => {
            console.log(`\n\n🌐 Nemodian 2244-1 API Backend running at http://localhost:${API_PORT}`);
            console.log("Connect the AI Code Editor (ai-editor.html) to this endpoint.");
        });
        return;
    }

    // 3. Command Line Interface (CLI) Mode (Similar to Bash script logic)
    // The original CLI logic using Commander would go here if needed.
    // For this demonstration, we'll just run a test prompt if no arguments are provided.
    
    if (process.argv.length > 2) {
        // Simple command execution logic (e.g., ai status)
        if (process.argv[2] === 'status') { 
            // Simplified status check
            console.log("Status check implemented via Commander logic in full version.");
        }
        // ... command logic
    } else {
        console.log("Use: node ai.js --api-server to start the backend.");
        console.log("Use: node ai.js 'your prompt' to run a single reasoning loop (requires full Commander setup).");
    }
}

// --- Node.js Entry Point ---
cli_main().catch(async (err) => {
    await log_event("FATAL", `Script crashed: ${err.message}`);
    process.exit(1);
});
