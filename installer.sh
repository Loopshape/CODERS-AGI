#!/bin/bash

# Coders AGI - Universal Installer (apt/brew/npm/pip only)
set -e

echo "🚀 Starting Coders AGI Universal Installation..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[*]${NC} $1"; }
log_success() { echo -e "${GREEN}[+]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[-]${NC} $1"; }
log_step() { echo -e "${CYAN}[→]${NC} $1"; }

# Detect platform and package manager
detect_platform() {
    if command -v apt >/dev/null 2>&1; then
        echo "apt"
    elif command -v brew >/dev/null 2>&1; then
        echo "brew"
    else
        echo "unknown"
    fi
}

# Install system dependencies using only apt/brew
install_system_deps() {
    local pm=$(detect_platform)
    
    log_step "Installing system dependencies using $pm..."
    
    case $pm in
        "apt")
            sudo apt update
            sudo apt install -y curl wget git python3 python3-pip nodejs npm
            ;;
        "brew")
            brew update
            brew install curl wget git python node
            ;;
        *)
            log_warn "Unknown package manager. Please install manually:"
            log_warn "curl, wget, git, python3, pip, nodejs, npm"
            ;;
    esac
}

# Install Ollama using official script (curl-based)
install_ollama() {
    if command -v ollama >/dev/null 2>&1; then
        log_success "Ollama already installed"
        return 0
    fi

    log_step "Installing Ollama..."
    
    curl -fsSL https://ollama.ai/install.sh | sh
    
    if ! command -v ollama >/dev/null 2>&1; then
        log_error "Ollama installation failed"
        return 1
    fi
    
    log_success "Ollama installed successfully"
}

# Install Python dependencies using pip
install_python_deps() {
    log_step "Installing Python dependencies..."
    
    pip install requests numpy pandas matplotlib || pip3 install requests numpy pandas matplotlib
    
    log_success "Python dependencies installed"
}

# Create directory structure
create_directories() {
    log_step "Creating directory structure..."
    
    mkdir -p ~/.coders-agi
    mkdir -p ~/.coders-agi/src
    mkdir -p ~/.coders-agi/public
    mkdir -p ~/bin
    mkdir -p ~/.ai_backups
    
    log_success "Directories created"
}

# Create package.json
create_package_json() {
    log_step "Creating package.json..."
    
    cat > ~/.coders-agi/package.json << 'EOF'
{
  "name": "coders-agi",
  "version": "1.0.0",
  "description": "Ollama Node.js wrapper with React/Vite frontend",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "serve": "node server.js",
    "start": "node index.js",
    "ai": "node index.js",
    "install-deps": "npm install"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.4.0",
    "chokidar": "^3.5.3",
    "cors": "^2.8.5",
    "glob": "^10.3.0"
  },
  "devDependencies": {
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
EOF
    
    log_success "package.json created"
}

# Create main index.js
create_index_js() {
    log_step "Creating main index.js..."
    
    cat > ~/.coders-agi/index.js << 'EOF'
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
EOF
    
    chmod +x ~/.coders-agi/index.js
    log_success "index.js created"
}

# Create server.js
create_server_js() {
    log_step "Creating server.js..."
    
    cat > ~/.coders-agi/server.js << 'EOF'
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
EOF
    
    log_success "server.js created"
}

# Create simplified React app
create_react_app() {
    log_step "Creating React app..."
    
    mkdir -p ~/.coders-agi/src
    
    cat > ~/.coders-agi/src/App.jsx << 'EOF'
import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/process', { prompt });
      setResponse(JSON.stringify(res.data.result, null, 2));
    } catch (error) {
      setResponse('Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🤖 Coders AGI</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          rows={6}
          style={{ width: '100%', marginBottom: '10px' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Send'}
        </button>
      </form>
      {response && (
        <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
          {response}
        </pre>
      )}
    </div>
  );
}

export default App;
EOF

    cat > ~/.coders-agi/src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

    cat > ~/.coders-agi/src/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Coders AGI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.jsx"></script>
  </body>
</html>
EOF
    
    log_success "React app created"
}

# Create wrapper script
create_wrapper_script() {
    log_step "Creating wrapper script..."
    
    cat > ~/bin/ai << 'EOF'
#!/bin/bash

NODE_SCRIPT="$HOME/.coders-agi/index.js"

if [ ! -f "$NODE_SCRIPT" ]; then
    echo "Error: Coders AGI not installed. Run installer first."
    exit 1
fi

node "$NODE_SCRIPT" "$@"
EOF

    chmod +x ~/bin/ai
    log_success "Wrapper script created"
}

# Update bashrc
update_bashrc() {
    log_step "Updating .bashrc..."
    
    if ! grep -q "CODERS_AGI" ~/.bashrc; then
        cat >> ~/.bashrc << 'EOF'

# Coders AGI Configuration
export PATH="$HOME/bin:$PATH"
export OLLAMA_HOST="http://localhost:11434"
export OLLAMA_MODEL="gemma3:1b"
# export DEEPSEEK_API_KEY="your_key_here"

alias ai="node $HOME/.coders-agi/index.js"
EOF
    fi
    
    log_success ".bashrc updated"
}

# Install npm dependencies
install_npm_deps() {
    log_step "Installing npm dependencies..."
    
    cd ~/.coders-agi
    if npm install; then
        log_success "npm dependencies installed"
    else
        log_error "npm install failed"
        return 1
    fi
}

# Build React app
build_react_app() {
    log_step "Building React app..."
    
    cd ~/.coders-agi
    if npm run build; then
        log_success "React app built"
    else
        log_warn "React build failed, but continuing..."
    fi
}

# Main installation
main_installation() {
    log_info "Starting installation..."
    
    install_system_deps
    install_ollama
    install_python_deps
    create_directories
    create_package_json
    create_index_js
    create_server_js
    create_react_app
    create_wrapper_script
    update_bashrc
    install_npm_deps
    build_react_app
    
    log_success "🎉 Installation complete!"
    echo ""
    echo "Next steps:"
    echo "  source ~/.bashrc"
    echo "  ollama pull gemma3:1b"
    echo "  ai prompt 'Hello world'"
    echo ""
    echo "Optional: Set DEEPSEEK_API_KEY in ~/.bashrc"
}

# Run installation
main_installation
