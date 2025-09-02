
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { LogEntry, LogType, ProcessedFile, CodeReviewReport, CodeIssue, ChatMessage, MessageSender, ApiRequest, ApiResponse, ApiHistoryEntry, SavedApiRequest } from './types';
import { processFiles, scanEnvironment, processPrompt, getInstallScript, processUrlPrompt, gitPull, gitPush, gitClone, sendApiRequest, getConfig, saveConfig } from './services/scriptService';
import { getGeminiSuggestions, getGeminiCodeReview, getGeminiHistoryReview } from './services/geminiService';
import { getLocalAiSuggestions, chatWithLocalAi, getLocalAiBashExtension, getLocalAiCodeReview } from './services/localAiService';
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
        timestamp: new Date().toLocaleTimeString(),
    };
    setChatMessages([chatIntroMessage]);
    setIsChatOpen(true);
  }, [addLog]);

  const runAction = useCallback(async <T,>(
    actionName: string, 
    actionFn: () => Promise<T>, 
    onSuccess: (result: T) => void,
    options: { file?: File, initialLog?: string } = {}
  ) => {
    setLoadingAction(actionName);
    setProgress(0);
    options.file && setProcessingFile(options.file);
    
    addLog(LogType.Info, options.initialLog || `Starting action: ${actionName}...`);
    setActiveOutput('logs');
    
    try {
      const progressInterval = setInterval(() => setProgress(p => Math.min(p + 5, 90)), 200);
      const result = await actionFn();
      clearInterval(progressInterval);
      setProgress(95);
      
      onSuccess(result);
      
      addLog(LogType.Success, `${actionName} completed successfully.`);
      setProgress(100);
    } catch (error) {
      setProgress(100);
      triggerErrorChat(actionName, error);
    } finally {
      setTimeout(() => {
        setLoadingAction(null);
        setProcessingFile(null);
        setProgress(0);
      }, 500);
    }
  }, [addLog, triggerErrorChat]);


  const handleProcessFiles = useCallback((files: File[], enhancementType: 'none' | 'local' | 'gemini') => {
    if (files.length === 0) {
      addLog(LogType.Warn, "No files selected.");
      return;
    }
    const actionName = enhancementType === 'none' ? 'processFiles' : `processFilesWith${enhancementType.charAt(0).toUpperCase() + enhancementType.slice(1)}AI`;
    const initialLogMessage = `Processing ${files.length} file(s)${enhancementType !== 'none' ? ` with ${enhancementType.charAt(0).toUpperCase() + enhancementType.slice(1)} AI enhancement...` : '...'}`;
    
    runAction(
      actionName,
      () => processFiles(files, setProgress, enhancementType),
      (result) => {
        setProcessedOutput(result.outputs);
        result.logs.forEach(log => addLog(log.type, log.message));
        setActiveOutput('code');
      },
      { initialLog: initialLogMessage }
    );
  }, [runAction, addLog]);

  const handleScanEnvironment = useCallback(() => {
    runAction(
      'scanEnvironment',
      async () => scanEnvironment(),
      (result) => {
        setProcessedOutput([{ fileName: result.fileName, content: result.output, history: [result.output], historyIndex: 0 }]);
        result.logs.forEach(log => addLog(log.type, log.message));
      }
    );
  }, [runAction, addLog]);
  
  const handleProcessPrompt = useCallback((prompt: string) => {
    runAction(
      'processPrompt',
      async () => processPrompt(prompt),
      (result) => {
        setProcessedOutput([{ fileName: result.fileName, content: result.output, history: [result.output], historyIndex: 0 }]);
        result.logs.forEach(log => addLog(log.type, log.message));
        setActiveOutput('code');
      }
    );
  }, [runAction, addLog]);

  const handleProcessUrl = useCallback((url: string) => {
    runAction(
      'processUrl',
      async () => processUrlPrompt(url),
      (result) => {
        setProcessedOutput([{ fileName: result.fileName, content: result.output, history: [result.output], historyIndex: 0 }]);
        result.logs.forEach(log => addLog(log.type, log.message));
        setActiveOutput('code');
      }
    );
  }, [runAction, addLog]);
  
  const handleStaticEnhance = useCallback((file: File) => {
      runAction(
        'staticEnhance',
        async () => {
            const content = await file.text();
            return processHtml(content);
        },
        (result) => {
            const newFileName = file.name.replace(/(\.[\w\d_-]+)$/i, '.static_enhanced$1');
            setProcessedOutput([{ fileName: newFileName, content: result.enhancedContent, history: [result.enhancedContent], historyIndex: 0 }]);
            result.logs.forEach(log => addLog(LogType.Info, log));
            setActiveOutput('code');
        },
        { file, initialLog: `Applying static enhancements to ${file.name}...` }
      );
  }, [runAction, addLog]);

  const handleLocalAiEnhance = useCallback((file: File) => {
      runAction(
          'localAiEnhance',
          async () => {
              const content = await file.text();
              // The local AI simulation uses environment info for context
              const envInfo = scanEnvironment().output; 
              return getLocalAiSuggestions(content, envInfo);
          },
          (suggestion) => {
              const newFileName = file.name.replace(/(\.[\w\d_-]+)$/i, '.local_ai_enhanced$1');
              setProcessedOutput([{ fileName: newFileName, content: suggestion, history: [suggestion], historyIndex: 0 }]);
              setActiveOutput('code');
          },
          { file, initialLog: `Enhancing ${file.name} with Local AI...` }
      );
  }, [runAction]);

  const handleAiEnhance = useCallback((file: File) => {
      runAction(
          'aiEnhance',
          async () => {
              const content = await file.text();
              return getGeminiSuggestions(content);
          },
          (suggestion) => {
              const newFileName = file.name.replace(/(\.[\w\d_-]+)$/i, '.ai_enhanced$1');
              setProcessedOutput([{ fileName: newFileName, content: suggestion, history: [suggestion], historyIndex: 0 }]);
              setActiveOutput('code');
          },
          { file, initialLog: `Enhancing ${file.name} with Gemini AI...` }
      );
  }, [runAction]);

  const handleAiCodeReview = useCallback((file: File) => {
    runAction(
      'aiCodeReview',
      async () => {
        const content = await file.text();
        return getGeminiCodeReview(content);
      },
      (report) => {
        const markdown = formatReviewAsMarkdown(report, file.name);
        const newFileName = `review_for_${file.name}.md`;
        setProcessedOutput([{ fileName: newFileName, content: markdown, history: [markdown], historyIndex: 0 }]);
        setActiveOutput('code');
      },
      { file, initialLog: `Reviewing ${file.name} with Gemini AI...` }
    );
  }, [runAction]);

  const handleLocalAiCodeReview = useCallback((file: File) => {
    runAction(
      'localAiCodeReview',
      async () => {
        const content = await file.text();
        return getLocalAiCodeReview(content);
      },
      (report) => {
        const markdown = formatReviewAsMarkdown(report, file.name);
        const newFileName = `local_review_for_${file.name}.md`;
        setProcessedOutput([{ fileName: newFileName, content: markdown, history: [markdown], historyIndex: 0 }]);
        setActiveOutput('code');
      },
      { file, initialLog: `Reviewing ${file.name} with Local AI...` }
    );
  }, [runAction]);

  const handleUrlEnhance = useCallback((url: string) => {
    runAction(
      'urlEnhance',
      async () => {
        // Step 1: Fetch content from URL
        addLog(LogType.Info, `Fetching content from ${url}...`);
        const { output: urlContent, logs: fetchLogs } = processUrlPrompt(url);
        fetchLogs.forEach(log => addLog(log.type, log.message));
        
        // Step 2: Enhance with Gemini AI
        addLog(LogType.Gemini, 'Enhancing content with Gemini AI...');
        const geminiSuggestion = await getGeminiSuggestions(urlContent);
        
        // Step 3: Forward to Local AI for further improvement
        addLog(LogType.AI, 'Forwarding to Local AI for final improvements...');
        const envInfo = scanEnvironment().output; // local AI needs env info
        const finalSuggestion = await getLocalAiSuggestions(geminiSuggestion, envInfo);
        
        return finalSuggestion;
      },
      (finalSuggestion) => { // Step 4: Display final result
        const fileName = (url.split('/').pop() || 'index.html').split('?')[0];
        const newFileName = `${fileName}.multiai_enhanced.html`;
        setProcessedOutput([{ fileName: newFileName, content: finalSuggestion, history: [finalSuggestion], historyIndex: 0 }]);
        setActiveOutput('code');
      },
      { initialLog: `Starting multi-stage AI enhancement for ${url}...`}
    )
  }, [runAction, addLog]);

  const hasEnhancedFile = useMemo(() => {
    return processedOutput?.some(f => f.fileName.includes('_enhanced.')) ?? false;
  }, [processedOutput]);

  const handleTrainingSimulation = useCallback((source: string) => {
    let trainingDataInfo = '';
    if (source === 'API history' && apiHistory.length > 0) {
        const dataSample = JSON.stringify(apiHistory.slice(0, 2), null, 2);
        trainingDataInfo = `Preparing training data from API history...\nSample:\n${dataSample}`;
    } else if (source === 'saved API requests' && savedApiRequests.length > 0) {
        const dataSample = JSON.stringify(savedApiRequests.slice(0, 2), null, 2);
        trainingDataInfo = `Preparing training data from saved API requests...\nSample:\n${dataSample}`;
    }
    
    runAction(
      `trainLocalAI`,
      async () => {
        if (trainingDataInfo) {
          addLog(LogType.Info, trainingDataInfo);
        }
        await new Promise(res => setTimeout(res, 500));
        setProgress(25); addLog(LogType.Info, "Analyzing data patterns...");
        await new Promise(res => setTimeout(res, 1000));
        setProgress(50); addLog(LogType.Info, "Updating model weights...");
        await new Promise(res => setTimeout(res, 1000));
        setProgress(85); addLog(LogType.Info, "Fine-tuning parameters...");
        await new Promise(res => setTimeout(res, 800));
      },
      () => {},
      { initialLog: `Training local AI from ${source}...` }
    );
  }, [runAction, addLog, apiHistory, savedApiRequests]);

  const handleImproveLocalAI = useCallback(() => {
      const enhancedFile = processedOutput?.find(f => f.fileName.includes('_enhanced.'));
      if (!enhancedFile) {
          addLog(LogType.Warn, "No enhanced file available for training.");
          return;
      }
      handleTrainingSimulation(enhancedFile.fileName);
  }, [processedOutput, addLog, handleTrainingSimulation]);

  const handleTrainFromUrl = useCallback((url: string) => {
    if (!url.trim()) { addLog(LogType.Warn, "Please enter a URL to train from."); return; }
    handleTrainingSimulation(url);
  }, [addLog, handleTrainingSimulation]);
  
  const handleTrainFromHistory = useCallback(() => handleTrainingSimulation('API history'), [handleTrainingSimulation]);
  const handleTrainFromSavedRequests = useCallback(() => handleTrainingSimulation('saved API requests'), [handleTrainingSimulation]);

  const handleGenerateExtension = useCallback(() => {
    runAction(
      'generateExtension',
      getLocalAiBashExtension,
      (result) => {
        setProcessedOutput([{ fileName: result.fileName, content: result.output, history: [result.output], historyIndex: 0 }]);
        result.logs.forEach(log => addLog(log.type, log.message));
        setActiveOutput('code');
      }
    )
  }, [runAction, addLog]);

  const handleGetInstallerScript = useCallback(() => {
     runAction(
        'getInstallerScript',
        async () => getInstallScript(),
        (result) => {
            setProcessedOutput([{ fileName: result.fileName, content: result.output, history: [result.output], historyIndex: 0 }]);
            result.logs.forEach(log => addLog(log.type, log.message));
        }
    );
  }, [runAction, addLog]);

  const handleCloudAccelerate = useCallback(() => {
    if (processingFile && loadingAction === 'localAiEnhance') {
      addLog(LogType.Gemini, `Cloud acceleration requested for ${processingFile.name}. Switching to Gemini AI...`);
      handleAiEnhance(processingFile);
    } else {
       addLog(LogType.Warn, "Cloud acceleration is only available during Local AI enhancements.");
    }
  }, [processingFile, loadingAction, addLog, handleAiEnhance]);

  const handleApiRequest = useCallback((request: ApiRequest) => {
    runAction(
      'apiRequest',
      async () => {
        const newHistoryEntry: ApiHistoryEntry = { ...request, id: new Date().toISOString(), timestamp: new Date().toLocaleString() };
        setApiHistory(prev => [newHistoryEntry, ...prev.slice(0, 49)]);
        return sendApiRequest(request);
      },
      (result) => {
        setProcessedOutput([{ fileName: result.fileName, content: result.output, history: [result.output], historyIndex: 0 }]);
        result.logs.forEach(log => addLog(log.type, log.message));
        setActiveOutput('code');
      }
    )
  }, [runAction, addLog]);
  
  const handleReviewApiHistory = useCallback(() => {
    if (apiHistory.length === 0) {
        addLog(LogType.Warn, "API history is empty. Nothing to review.");
        return;
    }
    runAction(
        'reviewApiHistory',
        () => {
            const historyJson = JSON.stringify(apiHistory, null, 2);
            return getGeminiHistoryReview(historyJson);
        },
        (report) => {
            const newFileName = 'api_history_review.md';
            setProcessedOutput([{ fileName: newFileName, content: report, history: [report], historyIndex: 0 }]);
            setActiveOutput('code');
        },
        { initialLog: 'Reviewing API history with Gemini AI...' }
    );
  }, [runAction, apiHistory, addLog]);
  
  const handleSaveApiRequest = useCallback((name: string, request: ApiRequest) => {
    const newSavedRequest: SavedApiRequest = { name, request };
    setSavedApiRequests(prev => {
        const existing = prev.findIndex(r => r.name === name);
        if (existing !== -1) {
            const updated = [...prev];
            updated[existing] = newSavedRequest;
            return updated;
        }
        return [newSavedRequest, ...prev];
    });
    addLog(LogType.Success, `API request '${name}' saved.`);
  }, [addLog]);

  const onDeleteSavedRequest = useCallback((name: string) => {
    setSavedApiRequests(prev => prev.filter(r => r.name !== name));
    addLog(LogType.Info, `Saved request '${name}' deleted.`);
  }, [addLog]);

  const onClearApiHistory = useCallback(() => {
    setApiHistory([]);
    addLog(LogType.Info, `API history cleared.`);
  }, [addLog]);

  const handleSaveConfig = useCallback(async (fileName: string, content: string) => {
    addLog(LogType.Info, `Saving ${fileName}...`);
    const result = await saveConfig(fileName, content);
    result.logs.forEach(log => addLog(log.type, log.message));
  }, [addLog]);

  const handleCreateNewFile = useCallback(() => {
    const newFile: ProcessedFile = {
        fileName: 'untitled.txt',
        content: '',
        history: [''],
        historyIndex: 0
    };
    setProcessedOutput(prev => prev ? [...prev, newFile] : [newFile]);
    setActiveFileIndex(processedOutput?.length || 0);
    setActiveOutput('code');
  }, [processedOutput]);

  const handleContentChange = useCallback((newContent: string, index: number) => {
    setProcessedOutput(prev => {
        if (!prev) return null;
        const newOutput = [...prev];
        const file = newOutput[index];
        if (file && file.content !== newContent) {
            const newHistory = file.history.slice(0, file.historyIndex + 1);
            newHistory.push(newContent);
            newOutput[index] = { ...file, content: newContent, history: newHistory, historyIndex: newHistory.length - 1 };
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
            newOutput[index] = { ...file, content: file.history[newIndex], historyIndex: newIndex, };
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
            newOutput[index] = { ...file, content: file.history[newIndex], historyIndex: newIndex, };
        }
        return newOutput;
    });
  }, []);

  const handleRenameFile = useCallback((index: number, newName: string) => {
    setProcessedOutput(prev => {
        if (!prev) return null;
        const newOutput = [...prev];
        newOutput[index] = { ...newOutput[index], fileName: newName };
        return newOutput;
    });
  }, []);

  const handleDeleteFile = useCallback((index: number) => {
    setProcessedOutput(prev => {
        if (!prev) return null;
        const newOutput = prev.filter((_, i) => i !== index);
        if (newOutput.length === 0) {
            setActiveOutput('logs');
            return null;
        }
        if (activeFileIndex >= index) {
            setActiveFileIndex(Math.max(0, activeFileIndex - 1));
        }
        return newOutput;
    });
  }, [activeFileIndex]);

  const handleChatSendMessage = useCallback(async (message: string) => {
    const userMessage: ChatMessage = { sender: MessageSender.User, text: message, timestamp: new Date().toLocaleTimeString() };
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setIsChatLoading(true);

    try {
      const responseText = await chatWithLocalAi(newMessages);
      const aiMessage: ChatMessage = { sender: MessageSender.AI, text: responseText, timestamp: new Date().toLocaleTimeString() };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
       const errMessage: ChatMessage = { sender: MessageSender.Error, text: errorMessage, timestamp: new Date().toLocaleTimeString() };
       setChatMessages(prev => [...prev, errMessage]);
    } finally {
        setIsChatLoading(false);
    }
  }, [chatMessages]);

    const handleRequest = useCallback(async (
        handler: () => ({ output: string; logs: { type: LogType; message: string; }[]; fileName: string; }), 
        actionName: string, 
        setActiveToLogs = false
    ) => {
        runAction(
            actionName,
            async () => handler(),
            (result) => {
                setProcessedOutput([{ fileName: result.fileName, content: result.output, history: [result.output], historyIndex: 0 }]);
                result.logs.forEach(log => addLog(log.type, log.message));
                setActiveOutput(setActiveToLogs ? 'logs' : 'code');
            }
        );
    }, [runAction, addLog]);

  const handleGitPull = useCallback((url: string) => {
    handleRequest(() => gitPull(url), 'gitPull', true);
  }, [handleRequest]);

  const handleGitPush = useCallback((url: string) => {
    handleRequest(() => gitPush(url), 'gitPush', true);
  }, [handleRequest]);

  const handleGitClone = useCallback(async (url: string) => {
    if (!url.trim()) {
      addLog(LogType.Warn, "No repository URL provided.");
      return;
    }
    runAction(
        'gitClone',
        () => gitClone(url),
        (result) => {
            setProcessedOutput(result.outputs);
            result.logs.forEach(log => addLog(log.type, log.message));
            setActiveOutput('code');
        },
        { initialLog: `Cloning repository from ${url}...` }
    );
  }, [runAction, addLog]);


  return (
    <ErrorBoundary onImproveLocalAI={() => handleTrainingSimulation('an application error')}>
      <div className="min-h-screen bg-brand-bg font-sans flex flex-col">
        <Header onTogglePanel={() => setIsPanelOpen(!isPanelOpen)} isPanelOpen={isPanelOpen} />
        <main role="main" className={`flex-grow container mx-auto p-4 md:p-6 lg:p-8 grid gap-8 items-stretch transition-all duration-300 ease-in-out ${isPanelOpen ? 'lg:grid-cols-12' : 'lg:grid-cols-1'}`}>
          <div className={`transition-all duration-300 ease-in-out ${isPanelOpen ? 'lg:col-span-5' : 'hidden'}`}>
             <ControlPanel 
                onProcessFiles={handleProcessFiles}
                onScanEnvironment={handleScanEnvironment}
                onProcessPrompt={handleProcessPrompt}
                onProcessUrl={handleProcessUrl}
                onAiEnhance={handleAiEnhance}
                onLocalAiEnhance={handleLocalAiEnhance}
                onAiCodeReview={handleAiCodeReview}
                onLocalAiCodeReview={handleLocalAiCodeReview}
                onStaticEnhance={handleStaticEnhance}
                onUrlEnhance={handleUrlEnhance}
                onImproveLocalAI={handleImproveLocalAI}
                onTrainFromUrl={handleTrainFromUrl}
                onGenerateExtension={handleGenerateExtension}
                hasEnhancedFile={hasEnhancedFile}
                onGetInstallerScript={handleGetInstallerScript}
                onGitPull={handleGitPull}
                onGitPush={handleGitPush}
                onGitClone={handleGitClone}
                onCloudAccelerate={handleCloudAccelerate}
                onApiRequest={handleApiRequest}
                apiHistory={apiHistory}
                onReviewApiHistory={handleReviewApiHistory}
                savedApiRequests={savedApiRequests}
                onSaveApiRequest={handleSaveApiRequest}
                onDeleteSavedRequest={onDeleteSavedRequest}
                onClearApiHistory={onClearApiHistory}
                onTrainFromHistory={handleTrainFromHistory}
                onTrainFromSavedRequests={handleTrainFromSavedRequests}
                onSaveConfig={handleSaveConfig}
                onCreateNewFile={handleCreateNewFile}
                isLoading={isLoading}
                loadingAction={loadingAction}
                processingFile={processingFile}
                progress={progress}
            />
          </div>
          <div className={isPanelOpen ? 'lg:col-span-7' : 'lg:col-span-1'}>
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
              onCommand={(cmd) => addLog(LogType.Info, `> ${cmd}`)} // Placeholder, actual logic in chatbot/commandbar
              onUndo={handleUndo}
              onRedo={handleRedo}
              onRenameFile={handleRenameFile}
              onDeleteFile={handleDeleteFile}
            />
          </div>
        </main>
        <footer role="contentinfo" className="text-center p-4 border-t border-brand-border mt-auto">
          <p className="text-sm text-brand-text-secondary">UI generated from bash script logic by a world-class senior frontend React engineer.</p>
        </footer>
        <Chatbot 
            isOpen={isChatOpen}
            toggleChat={() => setIsChatOpen(!isChatOpen)}
            messages={chatMessages}
            onSendMessage={handleChatSendMessage}
            isLoading={isChatLoading}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;
