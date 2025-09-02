#!/bin/bash

# Coders AGI - Universal Installer with Go HTTP Server
set -e

echo "🚀 Starting Coders AGI with Go HTTP Server..."
echo "=================================================="

# ... [previous installer content remains the same until the Go tools section] ...

# Install Go-based tools and build HTTP server
install_go_tools() {
    if ! command -v go >/dev/null 2>&1; then
        log_warn "Go not available, skipping Go tools"
        return 0
    fi

    log_step "Installing Go tools and building HTTP server..."
    
    # Install useful Go-based utilities
    go install github.com/tj/go-termd@latest 2>/dev/null || true
    go install github.com/charmbracelet/glow@latest 2>/dev/null || true
    
    # Build our custom HTTP server
    build_go_http_server
    
    log_success "Go tools installed and HTTP server built"
}

# Build Go HTTP server
build_go_http_server() {
    log_step "Building Go HTTP server..."
    
    cat > ~/.coders-agi/go-http-server.go << 'EOF'
package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type ProcessRequest struct {
	Prompt   string `json:"prompt"`
	FilePath string `json:"filePath"`
	Type     string `json:"type"`
}

type ProcessResponse struct {
	Success bool        `json:"success"`
	Result  interface{} `json:"result,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type HealthResponse struct {
	Status   string `json:"status"`
	Ollama   string `json:"ollama"`
	DeepSeek bool   `json:"deepseek"`
	Go       bool   `json:"go"`
}

func main() {
	port := getEnv("PORT", "11435")
	ollamaHost := getEnv("OLLAMA_HOST", "http://localhost:11434")
	
	fmt.Printf("🚀 Starting Coders AGI Go HTTP Server on port %s\n", port)
	fmt.Printf("   Ollama host: %s\n", ollamaHost)
	fmt.Printf("   DeepSeek: %v\n", getEnv("DEEPSEEK_API_KEY", "") != "")
	fmt.Printf("   Press Ctrl+C to stop\n\n")

	http.HandleFunc("/api/process", processHandler)
	http.HandleFunc("/api/health", healthHandler)
	http.HandleFunc("/api/analyze", analyzeHandler)
	http.HandleFunc("/", serveStaticHandler)
	
	// Enable CORS
	corsHandler := func(h http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			
			h(w, r)
		}
	}

	log.Fatal(http.ListenAndServe(":"+port, 
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			corsHandler(http.DefaultServeMux.ServeHTTP)(w, r)
		})))
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func processHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ProcessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid JSON: "+err.Error())
		return
	}

	var result string
	var err error

	if req.FilePath != "" {
		result, err = processFile(req.FilePath)
	} else if req.Prompt != "" {
		result, err = processPrompt(req.Prompt)
	} else {
		sendError(w, "Either prompt or filePath must be provided")
		return
	}

	if err != nil {
		sendError(w, err.Error())
		return
	}

	var jsonResult interface{}
	if err := json.Unmarshal([]byte(result), &jsonResult); err != nil {
		// If it's not JSON, return as plain text
		jsonResult = map[string]interface{}{
			"output": result,
			"source": "raw",
		}
	}

	sendResponse(w, ProcessResponse{
		Success: true,
		Result:  jsonResult,
	})
}

func analyzeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Pattern string `json:"pattern"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid JSON: "+err.Error())
		return
	}

	if req.Pattern == "" {
		sendError(w, "Pattern is required")
		return
	}

	// Use Node.js script for analysis
	cmd := exec.Command("node", "./index.js", "analyze", req.Pattern)
	cmd.Dir = getScriptDir()
	output, err := cmd.CombinedOutput()
	
	if err != nil {
		sendError(w, "Analysis failed: "+string(output))
		return
	}

	var analysis interface{}
	if err := json.Unmarshal(output, &analysis); err != nil {
		sendError(w, "Invalid analysis output: "+err.Error())
		return
	}

	sendResponse(w, ProcessResponse{
		Success: true,
		Result:  analysis,
	})
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	sendResponse(w, HealthResponse{
		Status:   "ok",
		Ollama:   getEnv("OLLAMA_HOST", "http://localhost:11434"),
		DeepSeek: getEnv("DEEPSEEK_API_KEY", "") != "",
		Go:       true,
	})
}

func serveStaticHandler(w http.ResponseWriter, r *http.Request) {
	// Serve static files from dist directory
	distDir := filepath.Join(getScriptDir(), "dist")
	http.FileServer(http.Dir(distDir)).ServeHTTP(w, r)
}

func processFile(filePath string) (string, error) {
	cmd := exec.Command("node", "./index.js", "file", filePath)
	cmd.Dir = getScriptDir()
	output, err := cmd.CombinedOutput()
	
	if err != nil {
		return "", fmt.Errorf("file processing failed: %s", output)
	}
	
	return string(output), nil
}

func processPrompt(prompt string) (string, error) {
	cmd := exec.Command("node", "./index.js", "prompt", prompt)
	cmd.Dir = getScriptDir()
	output, err := cmd.CombinedOutput()
	
	if err != nil {
		return "", fmt.Errorf("prompt processing failed: %s", output)
	}
	
	return string(output), nil
}

func getScriptDir() string {
	exe, err := os.Executable()
	if err != nil {
		// Fallback to current directory
		dir, _ := os.Getwd()
		return dir
	}
	return filepath.Dir(exe)
}

func sendResponse(w http.ResponseWriter, response interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func sendError(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	json.NewEncoder(w).Encode(ProcessResponse{
		Success: false,
		Error:   message,
	})
}
EOF

    # Build the Go HTTP server
    cd ~/.coders-agi
    go build -o agi-server go-http-server.go
    
    if [ -f "./agi-server" ]; then
        chmod +x ./agi-server
        log_success "Go HTTP server built successfully"
    else
        log_warn "Go HTTP server build failed, using Node.js server instead"
    fi
}

# ... [rest of the installer remains similar, but update the server.js to be optional] ...

# Create server.js (Node.js fallback)
create_server_js() {
    log_step "Creating Node.js server (fallback)..."
    
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
    deepseek: !!process.env.DEEPSEEK_API_KEY,
    go: !!process.env.GOPATH,
    server: 'nodejs'
  });
});

app.get('/', (req, res) => {
  res.sendFile('dist/index.html', { root: '.' });
});

const PORT = process.env.PORT || 11434;
app.listen(PORT, () => {
  console.log(`🌐 Node.js Server running on http://localhost:${PORT}`);
});
EOF
    
    log_success "Node.js server created (fallback)"
}

# Update the wrapper script to support both servers
create_wrapper_script() {
    log_step "Creating enhanced wrapper script..."
    
    cat > ~/bin/ai << 'EOF'
#!/bin/bash

NODE_SCRIPT="$HOME/.coders-agi/index.js"
GO_SERVER="$HOME/.coders-agi/agi-server"
NODE_SERVER="$HOME/.coders-agi/server.js"

if [ ! -f "$NODE_SCRIPT" ]; then
    echo "Error: Coders AGI not installed. Run installer first."
    exit 1
fi

# Check if Ollama is running, start if not
if ! pgrep -f "ollama serve" >/dev/null 2>&1; then
    echo "Starting Ollama..."
    ollama serve >/dev/null 2>&1 &
    sleep 3
fi

# Add Go bin to PATH if available
if [ -d "$HOME/go/bin" ]; then
    export PATH="$HOME/go/bin:$PATH"
fi

# Server command
if [ "$1" = "serve-go" ]; then
    if [ -f "$GO_SERVER" ] && command -v go >/dev/null 2>&1; then
        echo "🚀 Starting Go HTTP Server..."
        shift
        exec "$GO_SERVER" "$@"
    else
        echo "Go server not available, falling back to Node.js server"
        exec node "$NODE_SERVER" "$@"
    fi
elif [ "$1" = "serve" ]; then
    echo "🚀 Starting Node.js HTTP Server..."
    shift
    exec node "$NODE_SERVER" "$@"
else
    # Regular commands
    exec node "$NODE_SCRIPT" "$@"
fi
EOF

    chmod +x ~/bin/ai
    log_success "Enhanced wrapper script created"
}

# Update bashrc with server options
update_bashrc() {
    log_step "Updating .bashrc with server options..."
    
    if ! grep -q "CODERS_AGI" ~/.bashrc; then
        cat >> ~/.bashrc << 'EOF'

# Coders AGI Configuration
export PATH="$HOME/bin:$PATH"
export OLLAMA_HOST="http://localhost:11434"
export OLLAMA_MODEL="gemma3:1b"
# export DEEPSEEK_API_KEY="your_key_here"

# Go configuration
export GOPATH="$HOME/go"
export PATH="$GOPATH/bin:$PATH"

alias ai="node $HOME/.coders-agi/index.js"
alias ai-serve-go="ai serve-go"
alias ai-serve-node="ai serve"

echo "🤖 Coders AGI with Go HTTP Server ready!"
echo "   Use 'ai serve-go' for Go server or 'ai serve' for Node.js server"
echo "   Use 'ai go-tool <tool>' for Go utilities"
EOF
    fi
    
    log_success ".bashrc updated"
}

# Update completion message
show_completion() {
    log_divider
    echo -e "${GREEN}🎉 Coders AGI with Go HTTP Server Complete!${NC}"
    echo ""
    echo -e "${CYAN}🚀 Server Options:${NC}"
    echo "  ${MAGENTA}ai serve-go${NC}    - Start Go HTTP server (port 11435)"
    echo "  ${MAGENTA}ai serve${NC}       - Start Node.js HTTP server (port 11434)"
    echo ""
    echo -e "${CYAN}🛠️  Available Commands:${NC}"
    echo "  ai prompt <text>      - Process text"
    echo "  ai file <path>        - Process file"  
    echo "  ai batch <pattern>    - Batch process"
    echo "  ai analyze <pattern>  - Token analysis"
    echo "  ai go-tool <tool>     - Use Go tools"
    echo ""
    echo -e "${CYAN}🌐 Web Interface:${NC}"
    echo "  Go Server:    http://localhost:11435"
    echo "  Node Server:  http://localhost:11434"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  source ~/.bashrc"
    echo "  ollama pull gemma3:1b"
    echo "  ai serve-go    # Start Go server"
    echo "  ai prompt 'Hello world'"
}

# Main installation
main_installation() {
    log_info "Starting installation..."
    
    install_system_deps
    install_go_tools
    install_ollama
    install_python_deps
    create_directories
    create_package_json
    create_index_js
    create_server_js
    create_react_app
    create_wrapper_script
    update_bashrc
    install_node_deps
    build_react_app
    
    show_completion
}

# Run installation
main_installation
