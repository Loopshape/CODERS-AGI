import express from 'express';
import cors from 'cors';
import { CodersAGI } from './index.js';

const app = express();
const agi = new CodersAGI();

app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

app.post('/api/process', async (req, res) => {
  try {
    const { prompt, filePath } = req.body;
    let result;
    
    if (filePath) {
      result = await agi.processFile(filePath);
    } else {
      result = await agi.processContent(prompt);
    }
    
    res.json({ success: true, result: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    ollama: process.env.OLLAMA_HOST || 'http://localhost:11434',
    deepseek: !!process.env.DEEPSEEK_API_KEY
  });
});

app.get('/', (req, res) => {
  res.sendFile('dist/index.html', { root: '.' });
});

const PORT = process.env.PORT || 11434;
app.listen(PORT, () => {
  console.log(`🌐 Server running on http://localhost:${PORT}`);
});
