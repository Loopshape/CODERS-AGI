import React, { useState, useCallback, useMemo } from 'react';
import { LogEntry, LogType, ProcessedFile } from './types';
import { processFiles, scanEnvironment, processPrompt, getBashrcIntegration, getInstallScript, debugScript, processUrlPrompt } from './services/scriptService';
import { getGeminiSuggestions } from './services/geminiService';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import OutputViewer from './components/OutputViewer';

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
    
    const initialLog: LogEntry = { type: LogType.Info, message: `Starting batch AI enhancement for ${files.length} file(s)...`, timestamp: new Date().toLocaleTimeString() };
    setLogs([initialLog]);
    setActiveOutput('logs');

    try {
      const result = await processFiles(files, (p) => setProgress(p));
      
      setProcessedOutput(result.outputs);
      
      const resultLogs = result.logs.map(log => ({ ...log, timestamp: new Date().toLocaleTimeString() }));
      const successLog: LogEntry = { type: LogType.Success, message: 'Batch enhancement complete.', timestamp: new Date().toLocaleTimeString() };

      setLogs(prevLogs => [...prevLogs, ...resultLogs, successLog]);
      
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

  const handleGetBashrc = useCallback(() => {
    handleRequest(getBashrcIntegration, 'getBashrc');
  }, [addLog]);

  const handleGetInstallScript = useCallback(() => {
    handleRequest(getInstallScript, 'getInstallScript');
  }, [addLog]);

  const handleDebugScript = useCallback(() => {
    handleRequest(debugScript, 'debugScript', true); // Set active to logs
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
      addLog(LogType.Info, `Read file content, sending to Gemini AI for analysis.`);
      setProgress(50);
      
      const suggestion = await getGeminiSuggestions(fileContent);
      setProgress(90);

      setProcessedOutput([{ fileName: `${file.name}.enhanced.html`, content: suggestion }]);
      addLog(LogType.Success, `Successfully received enhancement from Gemini AI.`);
      setActiveOutput('code');
      setProgress(100);

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
            onGetBashrc={handleGetBashrc}
            onGetInstallScript={handleGetInstallScript}
            onDebugScript={handleDebugScript}
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
