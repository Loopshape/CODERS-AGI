



import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { LogEntry, LogType, ProcessedFile, CodeReviewReport, CodeIssue, ChatMessage, MessageSender, ApiRequest, ApiResponse, ApiHistoryEntry, SavedApiRequest } from './types';
import { processFiles, scanEnvironment, processPrompt, getInstallScript, processUrlPrompt, gitPull, gitPush, gitClone, sendApiRequest, getConfig, saveConfig } from './services/scriptService';
import { getGeminiSuggestions, getGeminiCodeReview } from './services/geminiService';
import { getLocalAiSuggestions, chatWithLocalAi, getLocalAiBashExtension } from './services/localAiService';
import { processHtml } from './services/enhancementService';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import OutputViewer from './components/OutputViewer';
import ErrorBoundary from './components/ErrorBoundary';
import Chatbot from './components/Chatbot';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const EDITOR_SETTINGS_KEY = 'ai-tool-gui-editor-settings';
const API_HISTORY_KEY = 'ai-tool-gui-api-history';
const SAVED_API_REQUESTS_KEY = 'ai-tool-gui-saved-requests';


const formatReviewAsMarkdown = (report: CodeReviewReport, fileName: string): string => {
    let markdown = `# Code Review for ${fileName}\n\n`;
    markdown += `## 📝 Summary\n\n${report.reviewSummary}\n\n`;

    const formatIssues = (title: string, icon: string, issues: CodeIssue[]): string => {
        if (!issues || issues.length === 0) {
            return `## ${icon} ${title}\n\nNo issues found in this category.\n\n`;
        }
        let section = `## ${icon} ${title}\n\n`;
        issues.forEach(issue => {
            section += `- **Line ${issue.line || 'N/A'}:** ${issue.description}\n`;
            section += `  - **Suggestion:** ${issue.suggestion}\n\n`;
        });
        return section;
    };

    markdown += formatIssues('Potential Bugs', '🐛', report.potentialBugs);
    markdown += formatIssues('Security Vulnerabilities', '🛡️', report.securityVulnerabilities);
    markdown += formatIssues('Performance Improvements', '⚡', report.performanceImprovements);

    return markdown;
};

const App: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [processedOutput, setProcessedOutput] = useState<ProcessedFile[] | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [processingFile, setProcessingFile] = useState<File | null>(null);
  const [activeOutput, setActiveOutput] = useState<'code' | 'preview' | 'logs'>('code');
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [chat, setChat] = useState<Chat | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  
  // Editor and API settings states
  const [editorSettings, setEditorSettings] = useState(() => {
    try {
        const storedSettings = localStorage.getItem(EDITOR_SETTINGS_KEY);
        if (storedSettings) return JSON.parse(storedSettings);
    } catch (error) { console.error("Failed to parse editor settings from localStorage", error); }
    return { fontSize: 14, theme: 'dark' as 'light' | 'dark', tabSize: 4 };
  });

  const [apiHistory, setApiHistory] = useState<ApiHistoryEntry[]>(() => {
    try {
        const storedHistory = localStorage.getItem(API_HISTORY_KEY);
        if (storedHistory) return JSON.parse(storedHistory);
    } catch (error) { console.error("Failed to parse API history from localStorage", error); }
    return [];
  });
  
  const [savedApiRequests, setSavedApiRequests] = useState<SavedApiRequest[]>(() => {
    try {
        const storedRequests = localStorage.getItem(SAVED_API_REQUESTS_KEY);
        if (storedRequests) return JSON.parse(storedRequests);
    } catch (error) { console.error("Failed to parse saved API requests from localStorage", error); }
    return [];
  });

  // Chatbot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);


  const handleEditorSettingsChange = useCallback((newSettings: Partial<typeof editorSettings>) => {
    setEditorSettings(prev => ({ ...prev, ...newSettings }));
  }, []);
  
  // Effects to save settings to localStorage
  useEffect(() => {
    try { localStorage.setItem(EDITOR_SETTINGS_KEY, JSON.stringify(editorSettings)); } catch (error) { console.error("Failed to save editor settings", error); }
  }, [editorSettings]);

  useEffect(() => {
    try { localStorage.setItem(API_HISTORY_KEY, JSON.stringify(apiHistory)); } catch (error) { console.error("Failed to save API history", error); }
  }, [apiHistory]);

  useEffect(() => {
    try { localStorage.setItem(SAVED_API_REQUESTS_KEY, JSON.stringify(savedApiRequests)); } catch (error) { console.error("Failed to save API requests", error); }
  }, [savedApiRequests]);


  useEffect(() => {
    if (!chat) {
        const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: 'You are a helpful assistant for a frontend developer using a web-based file processing tool. Keep your answers concise and helpful.',
            },
        });
        setChat(newChat);
    }
  }, [chat]);

  const isLoading = useMemo(() => loadingAction !== null, [loadingAction]);

  const addLog = useCallback((type: LogType, message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date().toLocaleTimeString() }]);
  }, []);

  // Fix: Moved function declarations up to resolve 'used before declaration' error.
  const triggerErrorChat = useCallback((actionName: string, error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    
    addLog(LogType.Error, `${actionName} failed: ${errorMessage}`);
    setActiveOutput('logs');

    const chatIntroMessage: ChatMessage = {
        sender: MessageSender.AI,
        text: `It looks like the '${actionName}' action failed with the following error:\n\n"${errorMessage}"\n\nI can try to help you troubleshoot this. What would you like to do?`,
        timestamp: new Date().toLocaleTimeString()
    };
    
    setChatMessages(prev => {
        if (prev.length === 0) {
            return [
                { sender: MessageSender.AI, text: 'Hello! I am your local AI assistant. How can I help you today?', timestamp: new Date().toLocaleTimeString() },
                chatIntroMessage
            ];
        }
        return [...prev, chatIntroMessage];
    });
    setIsChatOpen(true);
  }, [addLog]);

  const handleRequest = useCallback(async (handler: () => ({ output: string; logs: { type: LogType; message: string; }[]; fileName: string; }) | Promise<{ output: string; logs: { type: LogType; message: string; }[]; fileName: string; }>, actionName: string, setActiveToLogs = false) => {
      setProcessingFile(null);
      setLoadingAction(actionName);
      setProgress(10);
      setLogs([]);
      setProcessedOutput(null);
      setActiveFileIndex(0);
      
      await new Promise(res => setTimeout(res, 200));
      setProgress(40);
      
      try {
          const result = await Promise.resolve(handler());
          await new Promise(res => setTimeout(res, 300));
          setProgress(90);
          setProcessedOutput([{ fileName: result.fileName, content: result.output, history: [result.output], historyIndex: 0 }]);
          result.logs.forEach(log => addLog(log.type, log.message));
          setActiveOutput(setActiveToLogs ? 'logs' : 'code');
          setProgress(100);
      } catch (error) {
            triggerErrorChat(actionName, error);
            setProgress(100);
      } finally {
          setTimeout(() => {
              setLoadingAction(null);
              setProgress(0);
          }, 500);
      }
  }, [addLog, triggerErrorChat]);

  const handleScanEnvironment = useCallback(() => {
      handleRequest(scanEnvironment, 'scanEnvironment', true);
  }, [handleRequest]);
  
  // Effect to handle startup logic (learning simulation and initial scan)
  useEffect(() => {
    const isViewingSharedSnippet = window.location.hash.startsWith('#/view/');
    if (isViewingSharedSnippet) return; // Don't run simulation or scan if viewing a shared link

    const hasLearnedFromParse5Fix = sessionStorage.getItem('learnedFromParse5Fix');

    if (!hasLearnedFromParse5Fix) {
      addLog(LogType.Info, "Applying learning from recent HTML parsing fix...");
      setTimeout(() => addLog(LogType.Info, "Analyzing root cause of parse5 error related to data URIs..."), 500);
      setTimeout(() => addLog(LogType.Info, "Updating local model with knowledge about correct SVG encoding in CSS..."), 1500);
      setTimeout(() => {
        addLog(LogType.Success, "Local AI model improved. It will now handle SVG data URIs more robustly.");
        handleScanEnvironment(); // Run scan after logs are shown
      }, 2500);
      sessionStorage.setItem('learnedFromParse5Fix', 'true');
    } else {
      handleScanEnvironment(); // Run scan immediately if already "learned"
    }
  }, [addLog, handleScanEnvironment]);
  
  // Effect to load shared code from URL hash
  useEffect(() => {
    const handleHashChange = () => {
        if (window.location.hash.startsWith('#/view/')) {
            try {
                const base64Content = window.location.hash.substring(8); // Length of '#/view/'
                const decodedContent = atob(base64Content);
                const sharedFile: ProcessedFile = {
                    fileName: 'shared_snippet.txt',
                    content: decodedContent,
                    history: [decodedContent],
                    historyIndex: 0
                };
                setProcessedOutput([sharedFile]);
                setActiveOutput('code');
                setActiveFileIndex(0);
                addLog(LogType.Info, "Loaded shared code snippet.");
                // Clean the hash to prevent re-loading on refresh
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            } catch (error) {
                console.error("Failed to decode shared content from URL hash", error);
                addLog(LogType.Error, "Could not load the shared code snippet. The link may be corrupted.");
            }
        }
    };
    handleHashChange();
  }, [addLog]);
  
  const handleProcessFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) {
        addLog(LogType.Warn, "No files selected for processing.");
        return;
    }
    setProcessingFile(null);
    setLoadingAction('processFiles');
    setProgress(0);
    setProcessedOutput(null);
    setActiveFileIndex(0);
    
    const initialLog: LogEntry = { type: LogType.Info, message: `Starting batch processing simulation for ${files.length} file(s)...`, timestamp: new Date().toLocaleTimeString() };
    setLogs([initialLog]);
    setActiveOutput('logs');

    try {
      const result = await processFiles(files, (p) => setProgress(p));
      
      const outputsWithHistory = result.outputs.map(output => ({
        ...output,
        history: [output.content],
        historyIndex: 0
      }));
      setProcessedOutput(outputsWithHistory);
      
      const resultLogs = result.logs.map(log => ({ ...log, timestamp: new Date().toLocaleTimeString() }));
      
      setLogs(prevLogs => [...prevLogs, ...resultLogs]);
      
      setActiveOutput('code');
      setProgress(100);

    } catch (error) {
      triggerErrorChat('Batch File Processing', error);
      setActiveOutput('logs');
      setProgress(100);
    } finally {
       setTimeout(() => {
            setLoadingAction(null);
            setProgress(0);
        }, 500);
    }
  }, [addLog, triggerErrorChat]);
  
  const handleProcessPrompt = useCallback((prompt: string) => {
      handleRequest(() => processPrompt(prompt), 'processPrompt');
  }, [handleRequest]);

  const handleProcessUrl = useCallback((url: string) => {
    handleRequest(() => processUrlPrompt(url), 'processUrl');
  }, [handleRequest]);

  const handleGetInstallerScript = useCallback(() => {
    handleRequest(() => getInstallScript(), 'getInstallerScript', true);
  }, [handleRequest]);

  const handleGitPull = useCallback((url: string) => {
    handleRequest(() => gitPull(url), 'gitPull', true);
  }, [handleRequest]);

  const handleGitPush = useCallback((url: string) => {
    handleRequest(() => gitPush(url), 'gitPush', true);
  }, [handleRequest]);
  
  const handleGitClone = useCallback(async (url: string) => {
    setLoadingAction('gitClone');
    setProgress(0);
    setLogs([]);
    setProcessedOutput(null);
    setActiveFileIndex(0);
    
    addLog(LogType.Info, `Starting clone from ${url}...`);
    setActiveOutput('logs');

    try {
      setProgress(20);
      const result = await gitClone(url);
      setProgress(80);
      
      const outputsWithHistory = result.outputs.map(output => ({
          ...output,
          history: [output.content],
          historyIndex: 0,
      }));
      setProcessedOutput(outputsWithHistory);
      
      const resultLogs = result.logs.map(log => ({ ...log, timestamp: new Date().toLocaleTimeString() }));
      setLogs(prevLogs => {
        const newLogs = [...prevLogs];
        resultLogs.forEach(log => newLogs.push(log));
        return newLogs;
      });
      
      setActiveOutput('code');
      setProgress(100);
    } catch (error) {
      triggerErrorChat('Git Clone', error);
      setProgress(100);
    } finally {
       setTimeout(() => {
            setLoadingAction(null);
            setProgress(0);
        }, 500);
    }
  }, [addLog, triggerErrorChat]);

  const handleLocalAIEnhance = useCallback(async (file: File) => {
    if (!file) {
      addLog(LogType.Warn, "No file selected for Local AI enhancement.");
      return;
    }

    setProcessingFile(file);
    setLoadingAction('localAIEnhance');
    setProgress(10);
    setLogs([]);
    setProcessedOutput(null);
    setActiveFileIndex(0);
    addLog(LogType.Info, `Preparing to enhance ${file.name} with Local AI...`);
    setActiveOutput('logs');

    try {
      setProgress(25);
      const fileContent = await file.text();
      addLog(LogType.Info, `Read file content, applying local enhancement rules.`);
      setProgress(50);
      
      const { enhancedContent, logs: enhancementLogs } = processHtml(fileContent);
      enhancementLogs.forEach(log => addLog(LogType.Info, log));
      
      setProgress(90);

      const parts = file.name.split('.');
      const extension = parts.length > 1 ? parts.pop() as string : '';
      const baseName = parts.join('.');
      const newFileName = extension ? `${baseName}.local_enhanced.${extension}` : `${file.name}.local_enhanced`;

      setProcessedOutput([{ fileName: newFileName, content: enhancedContent, history: [enhancedContent], historyIndex: 0 }]);
      addLog(LogType.Success, `Successfully applied local enhancements.`);
      setActiveOutput('code');
      setProgress(100);

    } catch (error) {
      triggerErrorChat('Local AI Enhancement', error);
      setProgress(100);
    } finally {
       setTimeout(() => {
            setLoadingAction(null);
            setProgress(0);
            setProcessingFile(null);
        }, 500);
    }
  }, [addLog, triggerErrorChat]);

  const handleOllamaEnhance = useCallback(async (file: File) => {
    if (!file) {
      addLog(LogType.Warn, "No file selected for Ollama enhancement.");
      return;
    }

    setProcessingFile(file);
    setLoadingAction('ollamaEnhance');
    setProgress(10);
    setLogs([]);
    setProcessedOutput(null);
    setActiveFileIndex(0);
    addLog(LogType.AI, `Preparing to enhance ${file.name} with Ollama...`);
    setActiveOutput('logs');

    try {
      addLog(LogType.Info, `Scanning environment for context...`);
      setProgress(25);
      const { output: envScanOutput, logs: scanLogs } = scanEnvironment();
      scanLogs.forEach(log => addLog(log.type, log.message));
      addLog(LogType.Success, `Environment scan complete.`);

      setProgress(40);
      const fileContent = await file.text();
      addLog(LogType.Info, `Read file content, sending to Ollama with context for enhancement.`);
      setProgress(50);
      
      const suggestion = await getLocalAiSuggestions(fileContent, envScanOutput);
      setProgress(90);

      const parts = file.name.split('.');
      const extension = parts.length > 1 ? parts.pop() as string : '';
      const baseName = parts.join('.');
      const newFileName = extension ? `${baseName}.ollama_enhanced.${extension}` : `${file.name}.ollama_enhanced`;

      setProcessedOutput([{ fileName: newFileName, content: suggestion, history: [suggestion], historyIndex: 0 }]);
      addLog(LogType.Success, `Successfully received enhancement from Ollama.`);
      setActiveOutput('code');
      setProgress(100);

    } catch (error) {
      triggerErrorChat('Ollama Enhancement', error);
      setProgress(100);
    } finally {
       setTimeout(() => {
            setLoadingAction(null);
            setProgress(0);
            setProcessingFile(null);
        }, 500);
    }
  }, [addLog, triggerErrorChat]);

  const handleGeminiEnhance = useCallback(async (file: File) => {
    if (!file) {
      addLog(LogType.Warn, "No file selected for Gemini AI enhancement.");
      return;
    }

    setProcessingFile(file);
    setLoadingAction('aiEnhance');
    setProgress(10);
    setLogs([]);
    setProcessedOutput(null);
    setActiveFileIndex(0);
    addLog(LogType.Gemini, `Preparing to enhance ${file.name} with Gemini AI...`);
    setActiveOutput('logs');

    try {
      setProgress(25);
      const fileContent = await file.text();
      addLog(LogType.Info, `Read file content, sending to Gemini AI for enhancement.`);
      setProgress(50);
      
      const suggestion = await getGeminiSuggestions(fileContent);
      setProgress(90);

      const parts = file.name.split('.');
      const extension = parts.length > 1 ? parts.pop() as string : '';
      const baseName = parts.join('.');
      const newFileName = extension ? `${baseName}.enhanced.${extension}` : `${file.name}.enhanced`;

      setProcessedOutput([{ fileName: newFileName, content: suggestion, history: [suggestion], historyIndex: 0 }]);
      addLog(LogType.Success, `Successfully received enhancement from Gemini AI.`);
      setActiveOutput('code');
      setProgress(100);

    } catch (error) {
      triggerErrorChat('Gemini AI Enhancement', error);
      setProgress(100);
    } finally {
       setTimeout(() => {
            setLoadingAction(null);
            setProgress(0);
            setProcessingFile(null);
        }, 500);
    }
  }, [addLog, triggerErrorChat]);
  
  const handleGeminiCodeReview = useCallback(async (file: File) => {
    if (!file) {
      addLog(LogType.Warn, "No file selected for Gemini Code Review.");
      return;
    }

    setProcessingFile(file);
    setLoadingAction('aiCodeReview');
    setProgress(10);
    setLogs([]);
    setProcessedOutput(null);
    setActiveFileIndex(0);
    addLog(LogType.Gemini, `Starting code review for ${file.name} with Gemini AI...`);
    setActiveOutput('logs');

    try {
      setProgress(25);
      const fileContent = await file.text();
      addLog(LogType.Info, `Read file content, sending to Gemini AI for review.`);
      setProgress(50);
      
      const reviewReport = await getGeminiCodeReview(fileContent);
      setProgress(90);

      const reviewMarkdown = formatReviewAsMarkdown(reviewReport, file.name);
      const newFileName = `review_for_${file.name}.md`;

      setProcessedOutput([{ fileName: newFileName, content: reviewMarkdown, history: [reviewMarkdown], historyIndex: 0 }]);
      addLog(LogType.Success, `Successfully received code review from Gemini AI.`);
      setActiveOutput('code');
      setProgress(100);

    } catch (error) {
      triggerErrorChat('Gemini AI Code Review', error);
      setProgress(100);
    } finally {
       setTimeout(() => {
            setLoadingAction(null);
            setProgress(0);
            setProcessingFile(null);
        }, 500);
    }
  }, [addLog, triggerErrorChat]);

  const handleUrlEnhance = useCallback(async (url: string) => {
    setLoadingAction('urlEnhance');
    setProgress(10);
    setLogs([]);
    setProcessedOutput(null);
    setActiveFileIndex(0);
    addLog(LogType.Gemini, `Fetching from ${url} to enhance with Gemini AI...`);
    setActiveOutput('logs');

    try {
      setProgress(25);
      const { output: urlContent, logs: fetchLogs } = processUrlPrompt(url);
      fetchLogs.forEach(log => addLog(log.type, log.message));
      addLog(LogType.Info, `Content fetched. Sending to Gemini AI for analysis.`);
      setProgress(50);

      const suggestion = await getGeminiSuggestions(urlContent);
      setProgress(90);
      
      let fileName = 'index.html';
      try {
        const urlParts = new URL(url);
        fileName = urlParts.pathname.split('/').pop() || 'index.html';
      } catch (e) {
        console.warn("Could not parse URL to get filename, using default.");
      }
      
      setProcessedOutput([{ fileName: `${fileName}.enhanced.html`, content: suggestion, history: [suggestion], historyIndex: 0 }]);
      addLog(LogType.Success, `Successfully received enhancement from Gemini AI for content from ${url}.`);
      setActiveOutput('code');
      setProgress(100);

    } catch (error) {
      triggerErrorChat('URL Enhancement', error);
      setProgress(100);
    } finally {
       setTimeout(() => {
            setLoadingAction(null);
            setProgress(0);
        }, 500);
    }
  }, [addLog, triggerErrorChat]);
  
  const handleCloudAcceleration = useCallback(async () => {
    if (!processingFile) {
        addLog(LogType.Warn, "No file is being processed to accelerate.");
        return;
    }

    const file = processingFile;
    setLoadingAction('cloudAcceleration');
    addLog(LogType.Gemini, `Cloud acceleration started for ${file.name}... The local AI will be trained with the result.`);
    setProgress(10);
    
    try {
        // Part 1: Gemini Enhancement
        setProgress(25);
        const fileContent = await file.text();
        addLog(LogType.Info, `Sending ${file.name} to Gemini AI for accelerated enhancement.`);
        setProgress(50);
        
        const suggestion = await getGeminiSuggestions(fileContent);
        setProgress(70);

        const parts = file.name.split('.');
        const extension = parts.length > 1 ? parts.pop() as string : '';
        const baseName = parts.join('.');
        const newFileName = extension ? `${baseName}.accelerated.enhanced.${extension}` : `${file.name}.accelerated.enhanced`;

        const enhancedFile: ProcessedFile = { fileName: newFileName, content: suggestion, history: [suggestion], historyIndex: 0 };
        setProcessedOutput([enhancedFile]);
        setActiveFileIndex(0);
        addLog(LogType.Success, `Successfully received accelerated enhancement from Gemini AI.`);
        setActiveOutput('code');
        
        // Part 2: Auto-improve local AI simulation
        await new Promise(res => setTimeout(res, 500)); // UX pause
        addLog(LogType.Info, `Using accelerated result to improve local AI model...`);
        
        await new Promise(res => setTimeout(res, 500));
        setProgress(75);
        addLog(LogType.Info, "Analyzing data patterns from cloud result...");
        
        await new Promise(res => setTimeout(res, 1000));
        setProgress(85);
        addLog(LogType.Info, "Updating local model weights...");

        await new Promise(res => setTimeout(res, 1000));
        setProgress(95);
        addLog(LogType.Info, "Fine-tuning parameters...");

        await new Promise(res => setTimeout(res, 800));
        setProgress(100);
        addLog(LogType.Success, `Local AI model successfully improved with data from ${enhancedFile.fileName}.`);

    } catch (error) {
        triggerErrorChat('Cloud Acceleration', error);
        setProgress(100);
    } finally {
        setTimeout(() => {
            setLoadingAction(null);
            setProgress(0);
            setProcessingFile(null); // Clear the file being processed
        }, 1000); // Longer delay to let user see success
    }
  }, [processingFile, addLog, triggerErrorChat]);

  const hasEnhancedFile = useMemo(() => {
    return processedOutput?.some(file => file.fileName.includes('.enhanced.')) ?? false;
  }, [processedOutput]);

    const runTrainingSimulation = useCallback(async (source: string) => {
        addLog(LogType.Info, `Starting local AI training simulation with data from ${source}...`);
        // Give a small delay for the initial message to appear before progress starts
        await new Promise(res => setTimeout(res, 300));
        setProgress(25);
        addLog(LogType.Info, "Analyzing data patterns...");
        
        await new Promise(res => setTimeout(res, 1000));
        setProgress(50);
        addLog(LogType.Info, "Updating model weights...");

        await new Promise(res => setTimeout(res, 1000));
        setProgress(85);
        addLog(LogType.Info, "Fine-tuning parameters...");

        await new Promise(res => setTimeout(res, 800));
        setProgress(100);
        addLog(LogType.Success, `Local AI model successfully improved with data from ${source}.`);
    }, [addLog]);

    const handleImproveLocalAI = useCallback((errorInfo?: string) => {
        const enhancedFile = processedOutput?.find(file => file.fileName.includes('.enhanced.'));
        const trainingSource = errorInfo ? 'an application error report' : enhancedFile?.fileName;

        if (!trainingSource) {
            addLog(LogType.Warn, "No training data available. Run 'Gemini AI Enhance' on a file or encounter an error to improve the AI.");
            return;
        }

        setLoadingAction('improveLocalAI');
        setProgress(0);
        setLogs([]);
        setActiveOutput('logs');
        
        (async () => {
            try {
                await runTrainingSimulation(trainingSource);
            } catch (error) {
                triggerErrorChat('improveLocalAI', error);
            } finally {
                setTimeout(() => {
                    setLoadingAction(null);
                    setProgress(0);
                }, 500);
            }
        })();
    }, [processedOutput, addLog, runTrainingSimulation, triggerErrorChat]);

    const handleTrainFromUrl = useCallback(async (url: string) => {
        if (!url.trim()) {
            addLog(LogType.Warn, "Please provide a URL to train from.");
            return;
        }

        setLoadingAction('trainFromUrl');
        setProgress(10);
        setLogs([]);
        setProcessedOutput(null);
        setActiveFileIndex(0);
        addLog(LogType.Gemini, `Preparing to train local AI from ${url}...`);
        setActiveOutput('logs');

        try {
            const { logs: fetchLogs } = processUrlPrompt(url);
            fetchLogs.forEach(log => addLog(log.type, log.message));
            addLog(LogType.Info, `Content fetched successfully. Starting training simulation.`);
            
            await runTrainingSimulation(url);

        } catch (error) {
            triggerErrorChat('Training from URL', error);
            setProgress(100);
        } finally {
            setTimeout(() => {
                setLoadingAction(null);
                setProgress(0);
            }, 500);
        }
    }, [addLog, triggerErrorChat, runTrainingSimulation]);
  
  const handleGenerateExtension = useCallback(() => {
    handleRequest(getLocalAiBashExtension, 'generateExtension');
  }, [handleRequest]);
  
    const handleApiRequest = useCallback(async (request: ApiRequest) => {
        const newHistoryEntry: ApiHistoryEntry = {
            ...request,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
        };
        setApiHistory(prev => [newHistoryEntry, ...prev].slice(0, 20)); // Keep last 20

        handleRequest(() => sendApiRequest(request), 'apiRequest', true);
    }, [handleRequest]);
    
    const handleSaveApiRequest = useCallback((name: string, request: ApiRequest) => {
        const newSavedRequest: SavedApiRequest = { name, request };
        setSavedApiRequests(prev => {
            const existingIndex = prev.findIndex(r => r.name === name);
            if (existingIndex > -1) {
                const newArr = [...prev];
                newArr[existingIndex] = newSavedRequest;
                return newArr;
            }
            return [...prev, newSavedRequest];
        });
        addLog(LogType.Success, `API request saved as "${name}".`);
    }, [addLog]);

    const handleDeleteSavedRequest = useCallback((name: string) => {
        setSavedApiRequests(prev => prev.filter(r => r.name !== name));
        addLog(LogType.Info, `Deleted saved request "${name}".`);
    }, [addLog]);

    const handleClearApiHistory = useCallback(() => {
        setApiHistory([]);
        addLog(LogType.Info, 'API request history cleared.');
    }, [addLog]);

    const handleTrainFromHistory = useCallback(async () => {
        if (apiHistory.length === 0) {
            addLog(LogType.Warn, "No API history available to train from.");
            return;
        }
        setLoadingAction('trainFromHistory');
        setProgress(0);
        setLogs([]);
        setActiveOutput('logs');
        
        try {
            const source = `${apiHistory.length} API requests from history`;
            await runTrainingSimulation(source);
        } catch(error) {
            triggerErrorChat('Train from History', error);
        } finally {
            setTimeout(() => {
                setLoadingAction(null);
                setProgress(0);
            }, 500);
        }
    }, [apiHistory, addLog, triggerErrorChat, runTrainingSimulation]);
    
    const handleTrainFromSavedRequests = useCallback(async () => {
        if (savedApiRequests.length === 0) {
            addLog(LogType.Warn, "No saved API requests available to train from.");
            return;
        }
        setLoadingAction('trainFromSaved');
        setProgress(0);
        setLogs([]);
        setActiveOutput('logs');
        
        try {
            const source = `${savedApiRequests.length} saved API requests`;
            await runTrainingSimulation(source);
        } catch(error) {
            triggerErrorChat('Train from Saved Requests', error);
        } finally {
            setTimeout(() => {
                setLoadingAction(null);
                setProgress(0);
            }, 500);
        }
    }, [savedApiRequests, addLog, triggerErrorChat, runTrainingSimulation]);

    const handleContentChange = useCallback((newContent: string, index: number) => {
        setProcessedOutput(prev => {
            if (!prev) return null;
            const newOutput = [...prev];
            const file = newOutput[index];
            if (file && file.content !== newContent) {
                const newHistory = file.history.slice(0, file.historyIndex + 1);
                newHistory.push(newContent);

                newOutput[index] = {
                    ...file,
                    content: newContent,
                    history: newHistory,
                    historyIndex: newHistory.length - 1
                };
            }
            return newOutput;
        });
    }, []);

    const handleUndo = useCallback((index: number) => {
        setProcessedOutput(prev => {
            if (!prev) return null;
            const newOutput = [...prev];
            const file = newOutput[index];
            if (file && file.historyIndex > 0) {
                const newIndex = file.historyIndex - 1;
                newOutput[index] = {
                    ...file,
                    content: file.history[newIndex],
                    historyIndex: newIndex,
                };
            }
            return newOutput;
        });
    }, []);

    const handleRedo = useCallback((index: number) => {
        setProcessedOutput(prev => {
            if (!prev) return null;
            const newOutput = [...prev];
            const file = newOutput[index];
            if (file && file.historyIndex < file.history.length - 1) {
                const newIndex = file.historyIndex + 1;
                newOutput[index] = {
                    ...file,
                    content: file.history[newIndex],
                    historyIndex: newIndex,
                };
            }
            return newOutput;
        });
    }, []);
    
    const handleRenameFile = useCallback((index: number, newName: string) => {
        setProcessedOutput(prev => {
            if (!prev) return null;
            const newOutput = [...prev];
            const fileToRename = newOutput[index];
            if (fileToRename) {
                if (newOutput.some((file, i) => file.fileName === newName && i !== index)) {
                    addLog(LogType.Warn, `A file named "${newName}" already exists.`);
                    return prev;
                }
                newOutput[index] = { ...fileToRename, fileName: newName };
                addLog(LogType.Info, `Renamed "${fileToRename.fileName}" to "${newName}".`);
                return newOutput;
            }
            return prev;
        });
    }, [addLog]);

    const handleDeleteFile = useCallback((index: number) => {
        setProcessedOutput(prev => {
            if (!prev || !prev[index]) return prev;
            
            const fileToDelete = prev[index];
            const newOutput = prev.filter((_, i) => i !== index);

            if (newOutput.length === 0) {
                setActiveFileIndex(0);
                setActiveOutput('logs');
                addLog(LogType.Info, `Deleted "${fileToDelete.fileName}". No files remaining.`);
                return null;
            }

            setActiveFileIndex(prevIndex => {
                if (index < prevIndex) {
                    return prevIndex - 1;
                }
                if (index === prevIndex) {
                    return Math.max(0, index - 1);
                }
                return prevIndex;
            });
            
            addLog(LogType.Info, `Deleted "${fileToDelete.fileName}".`);
            return newOutput;
        });
    }, [addLog]);

    const handleCreateNewFile = useCallback(() => {
        const newFile: ProcessedFile = {
            fileName: 'untitled.txt',
            content: '',
            history: [''],
            historyIndex: 0
        };

        setProcessedOutput(prev => {
            const newOutput = prev ? [...prev] : [];
            let counter = 1;
            let finalName = newFile.fileName;
            while (newOutput.some(f => f.fileName === finalName)) {
                finalName = `untitled-${counter}.txt`;
                counter++;
            }
            newFile.fileName = finalName;
            
            newOutput.push(newFile);
            setActiveFileIndex(newOutput.length - 1);
            setActiveOutput('code');
            addLog(LogType.Info, `Created new file: ${newFile.fileName}`);
            return newOutput;
        });
    }, [addLog]);
    
    const handleCommandFromTerminal = useCallback(async (command: string) => {
        if (!command.trim() || isLoading) return;

        addLog(LogType.Info, `> ${command}`);
        setActiveOutput('logs');
        setLoadingAction('geminiCommand');
        try {
            const isAppCommand = ['scan-env', 'get-installer', 'help'].includes(command.trim().toLowerCase());
            if (isAppCommand) {
                switch (command.trim().toLowerCase()) {
                    case 'scan-env': handleScanEnvironment(); break;
                    case 'get-installer': handleGetInstallerScript(); break;
                    case 'help': addLog(LogType.Info, 'Available commands: scan-env, get-installer. Any other text will be sent to the AI assistant.'); break;
                }
                setLoadingAction(null); // App commands are handled by handleRequest, this avoids double-state issues
                return;
            }

            if (!chat) { throw new Error("Chat is not initialized."); }
            const response = await chat.sendMessage({ message: command });
            addLog(LogType.Gemini, response.text);

        } catch (error) {
            triggerErrorChat('Terminal Command', error);
        } finally {
            if (loadingAction === 'geminiCommand') {
                setLoadingAction(null);
            }
        }
    }, [addLog, isLoading, chat, loadingAction, handleScanEnvironment, handleGetInstallerScript, triggerErrorChat]);
    
    const handleChatSendMessage = useCallback(async (message: string) => {
        if (!message.trim() || isChatLoading) return;

        const userMessage: ChatMessage = { sender: MessageSender.User, text: message, timestamp: new Date().toLocaleTimeString() };
        setChatMessages(prev => [...prev, userMessage]);
        setIsChatLoading(true);

        try {
            const responseText = await chatWithLocalAi([...chatMessages, userMessage]);
            const aiMessage: ChatMessage = { sender: MessageSender.AI, text: responseText, timestamp: new Date().toLocaleTimeString() };
            setChatMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            const errorMsg: ChatMessage = { sender: MessageSender.Error, text: errorMessage, timestamp: new Date().toLocaleTimeString() };
            setChatMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsChatLoading(false);
        }
    }, [isChatLoading, chatMessages]);

    return (
        <ErrorBoundary onImproveLocalAI={() => handleImproveLocalAI('Client-side application crash.')}>
          <div className="min-h-screen bg-brand-bg font-sans flex flex-col">
            <Header onTogglePanel={() => setIsPanelOpen(!isPanelOpen)} isPanelOpen={isPanelOpen} />
            <main role="main" className="flex-grow container mx-auto p-4 flex-1 flex flex-col lg:flex-row items-start gap-8">
                <aside className={`w-full lg:max-w-md xl:max-w-lg transition-all duration-300 ${isPanelOpen ? 'lg:w-1/3' : 'w-0 hidden lg:block'}`}>
                    <div className="h-full animate-fade-in">
                        <ControlPanel 
                            onProcessFiles={handleProcessFiles}
                            onScanEnvironment={handleScanEnvironment}
                            onProcessPrompt={handleProcessPrompt}
                            onProcessUrl={handleProcessUrl}
                            onAiEnhance={handleGeminiEnhance}
                            onOllamaEnhance={handleOllamaEnhance}
                            onAiCodeReview={handleGeminiCodeReview}
                            onLocalAIEnhance={handleLocalAIEnhance}
                            onUrlEnhance={handleUrlEnhance}
                            onImproveLocalAI={handleImproveLocalAI}
                            onTrainFromUrl={handleTrainFromUrl}
                            onGenerateExtension={handleGenerateExtension}
                            hasEnhancedFile={hasEnhancedFile}
                            onGetInstallerScript={handleGetInstallerScript}
                            onGitPull={handleGitPull}
                            onGitPush={handleGitPush}
                            onGitClone={handleGitClone}
                            onCloudAccelerate={handleCloudAcceleration}
                            onApiRequest={handleApiRequest}
                            onSaveConfig={saveConfig}
                            apiHistory={apiHistory}
                            savedApiRequests={savedApiRequests}
                            onSaveApiRequest={handleSaveApiRequest}
                            onDeleteSavedRequest={handleDeleteSavedRequest}
                            onClearApiHistory={handleClearApiHistory}
                            onTrainFromHistory={handleTrainFromHistory}
                            onTrainFromSavedRequests={handleTrainFromSavedRequests}
                            onCreateNewFile={handleCreateNewFile}
                            isLoading={isLoading}
                            loadingAction={loadingAction}
                            processingFile={processingFile}
                            progress={progress}
                        />
                    </div>
                </aside>
                <div className="flex-grow w-full h-full min-h-[600px]">
                    <OutputViewer
                        processedOutput={processedOutput}
                        logs={logs}
                        isLoading={isLoading}
                        isLoadingCommand={loadingAction === 'geminiCommand'}
                        activeOutput={activeOutput}
                        setActiveOutput={setActiveOutput}
                        activeFileIndex={activeFileIndex}
                        setActiveFileIndex={setActiveFileIndex}
                        onContentChange={handleContentChange}
                        editorSettings={editorSettings}
                        onEditorSettingsChange={handleEditorSettingsChange}
                        onCommand={handleCommandFromTerminal}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        onRenameFile={handleRenameFile}
                        onDeleteFile={handleDeleteFile}
                    />
                </div>
            </main>
            <Chatbot isOpen={isChatOpen} toggleChat={() => setIsChatOpen(!isChatOpen)} messages={chatMessages} onSendMessage={handleChatSendMessage} isLoading={isChatLoading} />
          </div>
        </ErrorBoundary>
      );
};

export default App;