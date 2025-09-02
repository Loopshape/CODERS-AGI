// --- Rootless AGI Core Express Server ---
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; // Non-privileged port
const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MODEL = process.env.MODEL_NAME || 'gemma:2b';

app.use(express.json());

async function runAiPrompt(prompt) {
    const response = await axios.post(OLLAMA_API_URL, { model: MODEL, prompt, stream: false });
    return response.data.response;
}

app.get('/', (req, res) => res.send('Rootless AGI Core Server is running.'));

app.post('/api/prompt', async (req, res) => {
    try {
        const result = await runAiPrompt(req.body.prompt);
        res.json({ response: result });
    } catch (e) { res.status(503).json({ error: `Ollama service error: ${e.message}` }); }
});

app.post('/api/url', async (req, res) => {
    try {
        const { data: html } = await axios.get(req.body.url);
        const $ = cheerio.load(html);
        $('script, style').remove();
        const cleanText = $('body').text().replace(/\s\s+/g, ' ').trim();
        const systemPrompt = `Analyze content from '${req.body.url}'. Summarize: Main Topic, Key Themes, Sentiment.\n\n---\n${cleanText}`;
        const result = await runAiPrompt(systemPrompt);
        res.json({ source: req.body.url, response: result });
    } catch (e) { res.status(500).json({ error: `Failed to process URL: ${e.message}` }); }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rootless AGI server listening on http://0.0.0.0:${PORT}`);
});
