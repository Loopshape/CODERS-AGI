import React, { useState, useCallback, useMemo } from 'react';
import { LogEntry, LogType, ProcessedFile, CodeReviewReport, CodeIssue } from './types';
import { processFiles, scanEnvironment, processPrompt, getBashrcAdaptation, getInstallScript, processUrlPrompt, gitInit, gitAdd, gitCommit, gitPush } from './services/scriptService';
import { getGeminiSuggestions, getGeminiCodeReview } from './services/geminiService';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import OutputViewer from './components/OutputViewer';

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
      handleRequest(scanEnvironment, 'scanEnvironment');
  }, [addLog]);
  
  const handleProcessPrompt = useCallback((prompt: string) => {
      handleRequest(() => processPrompt(prompt), 'processPrompt');
  }, [addLog]);

  const handleProcessUrl = useCallback((url: string) => {
    handleRequest(() => processUrlPrompt(url), 'processUrl');
  }, [addLog]);

  const handleGetBashrcAdaptation = useCallback(() => {
    handleRequest(getBashrcAdaptation, 'getBashrc');
  }, [addLog]);

  const handleGetInstallScript = useCallback(() => {
    handleRequest(getInstallScript, 'getInstallScript');
  }, [addLog]);

  const handleGitInit = useCallback(() => {
    handleRequest(gitInit, 'gitInit', true);
  }, [addLog]);

  const handleGitAdd = useCallback((files: string) => {
    handleRequest(() => gitAdd(files), 'gitAdd', true);
  }, [addLog]);

  const handleGitCommit = useCallback((message: string) => {
    handleRequest(() => gitCommit(message), 'gitCommit', true);
  }, [addLog]);

  const handleGitPush = useCallback((remote: string, branch: string) => {
    handleRequest(() => gitPush(remote, branch), 'gitPush', true);
  }, [addLog]);

  const handleGeminiEnhance = useCallback(async (file: File) => {
    if (!file) {
      addLog(LogType.Warn, "No file selected for Gemini AI code review.");
      return;
    }

    setProcessingFile(file);
    setLoadingAction('geminiEnhance');
    setProgress(10);
    setLogs([]);
    setProcessedOutput(null);
    setActiveFileIndex(0);
    addLog(LogType.Gemini, `Preparing to review ${file.name} with Gemini AI...`);
    setActiveOutput('logs');

    try {
      setProgress(25);
      const fileContent = await file.text();
      addLog(LogType.Info, `Read file content, sending to Gemini AI for review.`);
      setProgress(50);
      
      const reviewReport = await getGeminiCodeReview(fileContent);
      setProgress(90);

      const markdownReport = formatReviewAsMarkdown(reviewReport, file.name);

      setProcessedOutput([{ fileName: `${file.name}.review.md`, content: markdownReport }]);
      addLog(LogType.Success, `Successfully received code review from Gemini AI.`);
      setActiveOutput('code');
      setProgress(100);

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


  return (
    <div className="min-h-screen bg-brand-bg font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <ControlPanel 
            onProcessFiles={handleProcessFiles}
            onScanEnvironment={handleScanEnvironment}
            onProcessPrompt={handleProcessPrompt}
            onProcessUrl={handleProcessUrl}
            onGeminiEnhance={handleGeminiEnhance}
            onUrlEnhance={handleUrlEnhance}
            onGetBashrcAdaptation={handleGetBashrcAdaptation}
            onGetInstallScript={handleGetInstallScript}
            onGitInit={handleGitInit}
            onGitAdd={handleGitAdd}
            onGitCommit={handleGitCommit}
            onGitPush={handleGitPush}
            isLoading={isLoading}
            loadingAction={loadingAction}
            processingFile={processingFile}
            progress={progress}
        />
        <OutputViewer
          processedOutput={processedOutput}
          logs={logs}
          isLoading={isLoading}
          activeOutput={activeOutput}
          setActiveOutput={setActiveOutput}
          activeFileIndex={activeFileIndex}
          setActiveFileIndex={setActiveFileIndex}
        />
      </main>
      <footer className="text-center p-4 text-brand-text-secondary text-sm">
        <p>UI generated from bash script logic by a world-class senior frontend React engineer.</p>
      </footer>
    </div>
  );
};

export default App;