#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { homedir } from 'os';
import { join, basename } from 'path';
import axios from 'axios';
import { glob } from 'glob';

class CodersAGI {
  constructor() {
    this.HOME_ROOT = homedir();
    this.BACKUP_DIR = join(this.HOME_ROOT, '.ai_backups');
    this.OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma3:1b';
    this.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
    this.DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
    
    this.init();
  }

  init() {
    if (!existsSync(this.BACKUP_DIR)) {
      mkdirSync(this.BACKUP_DIR, { recursive: true });
    }
  }

  log(type, message) {
    const colors = {
      info: '\x1b[34m',
      success: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[${type.toUpperCase()}] ${message}${colors.reset}`);
  }

  async analyzeTokenComplexity(content) {
    const tokenEstimate = Math.ceil(content.length / 4);
    const complexityScore = Math.min(100, Math.max(1, (tokenEstimate / 1000) * 100));
    
    return {
      token_count: tokenEstimate,
      complexity: complexityScore,
      requires_cloud: tokenEstimate > 2000 || complexityScore > 70,
      processing_tier: complexityScore > 80 ? 'deepseek' : 
                      complexityScore > 50 ? 'hybrid' : 'local'
    };
  }

  async processWithDeepSeek(prompt, context = {}) {
    if (!this.DEEPSEEK_API_KEY) {
      this.log('warn', 'DeepSeek API key not set. Using local fallback.');
      return this.processWithOllama(prompt);
    }

    try {
      const response = await axios.post(this.DEEPSEEK_API_URL, {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a token-aware AI modulator. Analyze and process content.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return JSON.stringify({
        source: 'deepseek',
        timestamp: new Date().toISOString(),
        response: response.data.choices[0].message.content
      });

    } catch (error) {
      this.log('error', `DeepSeek error: ${error.message}`);
      return this.processWithOllama(prompt);
    }
  }

  async processWithOllama(prompt, context = {}) {
    try {
      const response = await axios.post(`${this.OLLAMA_HOST}/api/generate`, {
        model: this.OLLAMA_MODEL,
        prompt: prompt,
        stream: false
      });

      return JSON.stringify({
        source: 'ollama',
        timestamp: new Date().toISOString(),
        response: response.data.response
      });

    } catch (error) {
      this.log('error', `Ollama error: ${error.message}`);
      return this.getUniversalLaw();
    }
  }

  getUniversalLaw() {
    return JSON.stringify({
      source: 'fallback',
      timestamp: new Date().toISOString(),
      response: 'Universal law applied'
    });
  }

  async processContent(content) {
    const tokenAnalysis = await this.analyzeTokenComplexity(content);
    
    this.log('info', `Token analysis: ${JSON.stringify(tokenAnalysis)}`);

    if (tokenAnalysis.processing_tier === 'deepseek' && this.DEEPSEEK_API_KEY) {
      this.log('info', 'Routing to DeepSeek cloud processing');
      return await this.processWithDeepSeek(content, tokenAnalysis);
    } else {
      this.log('info', 'Routing to local Ollama processing');
      return await this.processWithOllama(content, tokenAnalysis);
    }
  }

  async backupFile(filePath) {
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      const timestamp = Date.now();
      const backupPath = join(this.BACKUP_DIR, `${basename(filePath)}.${timestamp}.bak`);
      const content = readFileSync(filePath, 'utf8');
      writeFileSync(backupPath, content);
      this.log('info', `Backup created: ${backupPath}`);
      return backupPath;
    }
    return null;
  }

  async processFile(filePath) {
    const backupPath = await this.backupFile(filePath);
    const content = readFileSync(filePath, 'utf8');
    this.log('info', `Processing file: ${filePath}`);
    
    const result = await this.processContent(content);
    
    const outputPath = `${filePath}.processed.json`;
    writeFileSync(outputPath, result);
    this.log('success', `Output saved to: ${outputPath}`);
    
    return result;
  }

  async watchDirectory(dirPath, pattern = '**/*') {
    this.log('info', `Watching directory: ${dirPath}`);
    
    const watcher = (await import('chokidar')).default;
    watcher.watch(dirPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true
    }).on('change', async (filePath) => {
      this.log('info', `File changed: ${filePath}`);
      await this.processFile(filePath);
    }).on('add', async (filePath) => {
      this.log('info', `New file: ${filePath}`);
      await this.processFile(filePath);
    });
  }

  async runPrompt(prompt) {
    this.log('info', `Running prompt: ${prompt.substring(0, 50)}...`);
    const result = await this.processContent(prompt);
    console.log(result);
    return result;
  }

  async batchProcess(pattern) {
    this.log('info', `Batch processing pattern: ${pattern}`);
    
    const files = await glob(pattern);
    const results = [];
    
    for (const file of files) {
      try {
        this.log('info', `Processing: ${file}`);
        const result = await this.processFile(file);
        results.push({ file, result: JSON.parse(result) });
      } catch (error) {
        results.push({ file, error: error.message });
      }
    }
    
    this.log('success', `Batch processed ${files.length} files`);
    return JSON.stringify(results, null, 2);
  }

  async analyzeTokens(pattern) {
    const files = await glob(pattern);
    const analysis = [];
    
    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf8');
        const tokenInfo = await this.analyzeTokenComplexity(content);
        analysis.push({ file, ...tokenInfo });
      } catch (error) {
        analysis.push({ file, error: error.message });
      }
    }
    
    return JSON.stringify(analysis, null, 2);
  }
}

// CLI Interface
const agi = new CodersAGI();
const command = process.argv[2];
const args = process.argv.slice(3);

(async () => {
  try {
    switch (command) {
      case 'init':
        agi.log('info', 'Environment initialized');
        break;
      case 'file':
        await agi.processFile(args[0]);
        break;
      case 'watch':
        await agi.watchDirectory(args[0], args[1]);
        break;
      case 'batch':
        console.log(await agi.batchProcess(args[0]));
        break;
      case 'prompt':
        await agi.runPrompt(args.join(' '));
        break;
      case 'analyze':
        console.log(await agi.analyzeTokens(args[0]));
        break;
      case 'serve':
        agi.log('info', 'Starting server...');
        import('./server.js');
        break;
      case 'status':
        agi.log('info', `OLLAMA_HOST: ${process.env.OLLAMA_HOST}`);
        agi.log('info', `OLLAMA_MODEL: ${process.env.OLLAMA_MODEL}`);
        agi.log('info', `DEEPSEEK_API_KEY: ${process.env.DEEPSEEK_API_KEY ? 'Set' : 'Not set'}`);
        break;
      default:
        agi.log('info', '🤖 Coders AGI - Universal AI Processor');
        agi.log('info', 'Usage: ai <command> [args]');
        agi.log('info', 'Commands: file, watch, batch, prompt, analyze, serve, status');
        break;
    }
  } catch (error) {
    agi.log('error', `Command failed: ${error.message}`);
    process.exit(1);
  }
})();
