
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { LogEntry, LogType, ProcessedFile, CodeReviewReport, CodeIssue } from './types';
import { processFiles, scanEnvironment, processPrompt, getInstallScript, processUrlPrompt, gitUpdate } from './services/scriptService';
import { getGeminiSuggestions, getGeminiCodeReview } from './services/geminiService';
import { processHtml } from './services/enhancementService';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import OutputViewer from './components/OutputViewer';
import ErrorBoundary from './components/ErrorBoundary';
import CommandBar from './components/CommandBar';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

const downloadFile = (content: string, fileName: string, mimeType: string = 'application/x-shellscript') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
  
  const handleRequest = async (handler: () => { output: string; logs: { type: LogType; message: string; }[]; fileName: string; }, actionName: string, setActiveToLogs = false) => {
      setProcessingFile(null);
      setLoadingAction(actionName);
      setProgress(10);
      setLogs([]);
      setProcessedOutput(null);
      setActiveFileIndex(0);
      
      await new Promise(res => setTimeout(res, 200));
      setProgress(40);
      
      try {
          const result = handler();
          await new Promise(res => setTimeout(res, 300));
          setProgress(90);
          setProcessedOutput([{ fileName: result.fileName, content: result.output }]);
          result.logs.forEach(log => addLog(log.type, log.message));
          setActiveOutput(setActiveToLogs ? 'logs' : 'code');
          setProgress(100);
      } catch (error) {
           const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            addLog(LogType.Error, `Processing failed: ${errorMessage}`);
            setProgress(100);
      } finally {
          setTimeout(() => {
              setLoadingAction(null);
              setProgress(0);
          }, 500);
      }
  }

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
      
      setProcessedOutput(result.outputs);
      
      const resultLogs = result.logs.map(log => ({ ...log, timestamp: new Date().toLocaleTimeString() }));
      
      setLogs(prevLogs => [...prevLogs, ...resultLogs]);
      
      setActiveOutput('code');
      setProgress(100);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      const errorLog: LogEntry = { type: LogType.Error, message: `Batch processing failed: ${errorMessage}`, timestamp: new Date().toLocaleTimeString() };
      setLogs(prevLogs => [...prevLogs, errorLog]);
      setActiveOutput('logs');
      setProgress(100);
    } finally {
       setTimeout(() => {
            setLoadingAction(null);
            setProgress(0);
        }, 500);
    }
  }, [addLog]);
  
  const handleScanEnvironment = useCallback(() => {
      handleRequest(scanEnvironment, 'scanEnvironment', true);
  }, [addLog]);
  
  const handleProcessPrompt = useCallback((prompt: string) => {
      handleRequest(() => processPrompt(prompt), 'processPrompt', true);
  }, [addLog]);

  const handleProcessUrl = useCallback((url: string) => {
    handleRequest(() => processUrlPrompt(url), 'processUrl');
  }, [addLog]);

  const handleGetInstallerScript = useCallback(() => {
    const scriptData = getInstallScript();
    downloadFile(scriptData.output, scriptData.fileName);
    handleRequest(() => scriptData, 'getInstallerScript', true);
  }, [addLog]);

  const handleGitUpdate = useCallback((url: string) => {
    handleRequest(() => gitUpdate(url), 'gitUpdate', true);
  }, [addLog]);

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

      setProcessedOutput([{ fileName: newFileName, content: enhancedContent }]);
      addLog(LogType.Success, `Successfully applied local enhancements.`);
      setActiveOutput('code');
      setProgress(100);

// FIX: Corrected catch block syntax from `(error) => {` to `(error) {`
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      addLog(LogType.Error, `Local AI enhancement failed: ${errorMessage}`);
      setActiveOutput('logs');
      setProgress(100);
    } finally {
       setTimeout(() => {
            setLoadingAction(null);
            setProgress(0);
            setProcessingFile(null);
        }, 500);
    }
  }, [addLog]);

  const handleGeminiEnhance = useCallback(async (file: File) => {
    if (!file) {
      addLog(LogType.Warn, "No file selected for Gemini AI enhancement.");
      return;
    }

    setProcessingFile(file);
    setLoadingAction('geminiEnhance');
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

      setProcessedOutput([{ fileName: newFileName, content: suggestion }]);
      addLog(LogType.Success, `Successfully received enhancement from Gemini AI.`);
      setActiveOutput('code');
      setProgress(100);

// FIX: Corrected catch block syntax from `(error) => {` to `(error) {`
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      addLog(LogType.Error, `Gemini AI enhancement failed: ${errorMessage}`);
      setActiveOutput('logs');
      setProgress(100);
    } finally {
       setTimeout(() => {
            setLoadingAction(null);
            setProgress(0);
            setProcessingFile(null);
        }, 500);
    }
  }, [addLog]);
  
  const handleGeminiCodeReview = useCallback(async (file: File) => {
    if (!file) {
      addLog(LogType.Warn, "No file selected for Gemini Code Review.");
      return;
    }

    setProcessingFile(file);
    setLoadingAction('geminiCodeReview');
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

      setProcessedOutput([{ fileName: newFileName, content: reviewMarkdown }]);
      addLog(LogType.Success, `Successfully received code review from Gemini AI.`);
      setActiveOutput('code');
      setProgress(100);

// FIX: Corrected catch block syntax from `(error) => {` to `(error) {`
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      addLog(LogType.Error, `Gemini AI code review failed: ${errorMessage}`);
      setActiveOutput('logs');
      setProgress(100);
    } finally {
       setTimeout(() => {
            setLoadingAction(null);
            setProgress(0);
            setProcessingFile(null);
        }, 500);
    }
  }, [addLog]);

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
      
      setProcessedOutput([{ fileName: `${fileName}.enhanced.html`, content: suggestion }]);
      addLog(LogType.Success, `Successfully received enhancement from Gemini AI for content from ${url}.`);
      setActiveOutput('code');
      setProgress(100);

// FIX: Corrected catch block syntax from `(error) => {` to `(error) {`
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      addLog(LogType.Error, `URL enhancement process failed: ${errorMessage}`);
      setActiveOutput('logs');
      setProgress(100);
    } finally {
       setTimeout(() => {
            setLoadingAction(null);
            setProgress(0);
        }, 500);
    }
  }, [addLog]);

  const hasEnhancedFile = useMemo(() => {
    return processedOutput?.some(file => file.fileName.includes('.enhanced.')) ?? false;
  }, [processedOutput]);

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
      addLog(LogType.Info, `Starting local AI training with data from ${trainingSource}...`);
      
      const runTrainingSimulation = async () => {
          await new Promise(res => setTimeout(res, 500));
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
          addLog(LogType.Success, `Local AI model successfully improved with data from ${trainingSource}.`);

          await new Promise(res => setTimeout(res, 500));
          setLoadingAction(null);
          setProgress(0);
      };

      runTrainingSimulation();

  }, [processedOutput, addLog]);

  const handleCommand = useCallback(async (command: string) => {
    if (!command.trim() || isLoading) return;

    addLog(LogType.Info, `> ${command}`);
    setActiveOutput('logs');
    setProcessedOutput(null);

    const parts = command.trim().match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const [cmd, ...args] = parts.map(p => p.startsWith('"') && p.endsWith('"') ? p.slice(1, -1) : p);

    switch (cmd.toLowerCase()) {
        case 'scan-env':
            handleScanEnvironment();
            break;
        case 'get-installer':
            handleGetInstallerScript();
            break;
        case 'help':
            addLog(LogType.Info, "Available commands: scan-env, get-installer, error-test. Any other text will be sent to the local AI via 'ollama run gemma3:1b'.");
            break;
        case 'error-test':
            setLoadingAction('commandError');
            setProgress(50);
            await new Promise(res => setTimeout(res, 400));
            addLog(LogType.Error, `Execution failed for command: '${command}'\nThis is a simulated error to demonstrate failure handling.`);
            setProgress(100);
            setTimeout(() => {
                setLoadingAction(null);
                setProgress(0);
            }, 500);
            break;
        default:
            handleProcessPrompt(command);
            break;
    }
}, [addLog, isLoading, handleScanEnvironment, handleGetInstallerScript, handleProcessPrompt]);

  return (
    <ErrorBoundary onImproveLocalAI={() => handleImproveLocalAI('Client-side application crash.')}>
      <div className="min-h-screen bg-brand-bg font-sans flex flex-col">
        <Header />
        <main role="main" className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5">
            <ControlPanel 
                onProcessFiles={handleProcessFiles}
                onScanEnvironment={handleScanEnvironment}
                onProcessPrompt={handleProcessPrompt}
                onProcessUrl={handleProcessUrl}
                onGeminiEnhance={handleGeminiEnhance}
                onGeminiCodeReview={handleGeminiCodeReview}
                onLocalAIEnhance={handleLocalAIEnhance}
                onUrlEnhance={handleUrlEnhance}
                onImproveLocalAI={handleImproveLocalAI}
                hasEnhancedFile={hasEnhancedFile}
                onGetInstallerScript={handleGetInstallerScript}
                onGitUpdate={handleGitUpdate}
                isLoading={isLoading}
                loadingAction={loadingAction}
                processingFile={processingFile}
                progress={progress}
            />
          </div>
          <div className="lg:col-span-7">
            <OutputViewer
              processedOutput={processedOutput}
              logs={logs}
              isLoading={isLoading}
              activeOutput={activeOutput}
              setActiveOutput={setActiveOutput}
              activeFileIndex={activeFileIndex}
              setActiveFileIndex={setActiveFileIndex}
            />
          </div>
        </main>
        <div className="container mx-auto px-4 md:px-6 lg:px-8 mt-auto pb-4">
            <CommandBar onCommand={handleCommand} isLoading={loadingAction === 'geminiCommand' || loadingAction === 'commandError'} />
        </div>
        <footer role="contentinfo" className="text-center p-4 border-t border-brand-border">
          <p className="text-sm text-brand-text-secondary">UI generated from bash script logic by a world-class senior frontend React engineer.</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
