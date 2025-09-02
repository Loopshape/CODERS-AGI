
import React, { useState, useRef, useEffect } from 'react';
import { LogEntry, LogType, ProcessedFile } from '../types';
import { useTermuxDetection } from '../hooks/useTermuxDetection';
import { CodeIcon } from './icons/CodeIcon';
import { EyeIcon } from './icons/EyeIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import DownloadButton from './DownloadButton';

interface OutputViewerProps {
  processedOutput: ProcessedFile[] | null;
  logs: LogEntry[];
  isLoading: boolean;
  activeOutput: 'code' | 'preview' | 'logs';
  setActiveOutput: (output: 'code' | 'preview' | 'logs') => void;
  activeFileIndex: number;
  setActiveFileIndex: (index: number) => void;
}

const OutputViewer: React.FC<OutputViewerProps> = ({ 
    processedOutput, 
    logs, 
    isLoading,
    activeOutput,
    setActiveOutput,
    activeFileIndex,
    setActiveFileIndex
}) => {
  const isTermux = useTermuxDetection();
  const currentFile = processedOutput?.[activeFileIndex];

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSkeleton />;
    }

    if (!processedOutput && logs.length === 0) {
        return <InitialState />;
    }

    switch (activeOutput) {
      case 'code':
        return currentFile ? <CodeDisplay content={currentFile.content} fileName={currentFile.fileName} /> : <NoContent message="No output to display. Process something first." />;
      case 'preview':
        return currentFile && currentFile.content.trim().startsWith('<') ? <iframe srcDoc={currentFile.content} title="Live Preview" className="w-full h-full bg-white rounded-b-lg" /> : <NoContent message="No HTML content to preview." />;
      case 'logs':
        return isTermux ? <TerminalView logs={logs} /> : <LogDisplay logs={logs} />;
      default:
        return <InitialState />;
    }
  };
  
  const isPreviewDisabled = !currentFile || !currentFile.content.trim().startsWith('<');

  return (
    <div className="bg-brand-surface rounded-lg border border-brand-border shadow-2xl flex flex-col h-[80vh] min-h-[600px]">
      <div className="flex border-b border-brand-border shrink-0" role="tablist" aria-label="Output viewer modes">
        <OutputTabButton icon={<CodeIcon />} label="Processed Output" isActive={activeOutput === 'code'} onClick={() => setActiveOutput('code')} disabled={!processedOutput} />
        <OutputTabButton icon={<EyeIcon />} label="Live Preview" isActive={activeOutput === 'preview'} onClick={() => setActiveOutput('preview')} disabled={isPreviewDisabled}/>
        <OutputTabButton icon={<TerminalIcon />} label={isTermux ? "Terminal" : "Logs"} isActive={activeOutput === 'logs'} onClick={() => setActiveOutput('logs')} />
      </div>

      {processedOutput && processedOutput.length > 1 && (activeOutput === 'code' || activeOutput === 'preview') && (
        <div className="flex border-b border-brand-border bg-brand-bg/50 px-2 shrink-0 overflow-x-auto" role="tablist" aria-label="Processed files">
          {processedOutput.map((file, index) => (
            <FileTabButton
              key={`${file.fileName}-${index}`}
              fileName={file.fileName}
              isActive={index === activeFileIndex}
              onClick={() => setActiveFileIndex(index)}
            />
          ))}
        </div>
      )}

      <div className="p-1 flex-grow overflow-auto" role="tabpanel">
        {renderContent()}
      </div>
    </div>
  );
};

const OutputTabButton: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; disabled?: boolean; }> = ({ icon, label, isActive, onClick, disabled = false }) => (
    <button onClick={onClick} className={`flex items-center justify-center space-x-2 flex-1 text-center py-3 px-2 font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-accent/50 ${disabled ? 'text-brand-text-secondary/50 cursor-not-allowed' : isActive ? 'text-brand-accent bg-brand-bg' : 'text-brand-text-secondary hover:text-brand-text-primary'}`} disabled={disabled} role="tab" aria-selected={isActive}>
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const FileTabButton: React.FC<{ fileName: string; isActive: boolean; onClick: () => void; }> = ({ fileName, isActive, onClick }) => (
    <button onClick={onClick} className={`py-2 px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 focus:outline-none border-b-2 ${isActive ? 'text-brand-accent border-brand-accent' : 'text-brand-text-secondary hover:text-brand-text-primary border-transparent'}`} role="tab" aria-selected={isActive}>
        {fileName}
    </button>
);

const LoadingSkeleton: React.FC = () => (
    <div className="p-6 animate-pulse" aria-label="Loading content">
        <div className="h-4 bg-brand-border rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
            <div className="h-4 bg-brand-border rounded w-full"></div>
            <div className="h-4 bg-brand-border rounded w-full"></div>
            <div className="h-4 bg-brand-border rounded w-3/4"></div>
        </div>
        <div className="h-4 bg-brand-border rounded w-1/3 mb-4 mt-8"></div>
        <div className="space-y-2">
            <div className="h-4 bg-brand-border rounded w-full"></div>
            <div className="h-4 bg-brand-border rounded w-5/6"></div>
        </div>
    </div>
);

const InitialState: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 text-brand-text-secondary">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 text-brand-border">
            <path d="M7 8L3 12L7 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 8L21 12L17 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 4L10 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h3 className="text-xl font-bold text-brand-text-primary">Ready to Process</h3>
        <p className="max-w-md">Select an action from the control panel to see the results here.</p>
    </div>
);

const NoContent: React.FC<{ message: string }> = ({ message }) => (
     <div className="flex flex-col items-center justify-center h-full text-center p-8 text-brand-text-secondary">
        <p className="max-w-md">{message}</p>
    </div>
)

const getLanguage = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
        case 'js':
        case 'jsx':
            return 'javascript';
        case 'ts':
        case 'tsx':
            return 'typescript';
        case 'css':
            return 'css';
        case 'json':
            return 'json';
        case 'html':
        case 'xml':
            return 'markup';
        case 'md':
            return 'markdown';
        case 'sh':
            return 'bash';
        case 'py':
            return 'python';
        case 'java':
            return 'java';
        case 'c':
        case 'cpp':
            return 'cpp';
        default:
            return 'plaintext';
    }
};

const CodeDisplay: React.FC<{ content: string; fileName: string; }> = ({ content, fileName }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const language = getLanguage(fileName);

    return (
        <div className="bg-brand-bg rounded-lg h-full flex flex-col">
            <div className="flex justify-between items-center p-3 bg-brand-surface border-b border-brand-border rounded-t-lg">
                <span className="text-sm font-mono text-brand-text-secondary">{fileName}</span>
                <div className="flex items-center space-x-2">
                    <button onClick={handleCopy} className="text-sm bg-brand-border/50 px-3 py-1 rounded hover:bg-brand-accent hover:text-white transition-colors">
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <DownloadButton content={content} fileName={fileName} />
                </div>
            </div>
            <div className="flex-grow overflow-auto text-sm" style={{fontSize: '0.875rem'}}>
                <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    showLineNumbers
                    wrapLines={true}
                    wrapLongLines={true}
                    lineNumberStyle={{ minWidth: '2.5em', paddingRight: '1em', textAlign: 'right', color: '#8B949E' }}
                    customStyle={{ margin: 0, height: '100%', backgroundColor: '#0D1117', padding: '1rem' }}
                    codeTagProps={{ style: { fontFamily: 'inherit' } }}
                >
                    {String(content).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

const logColorMap: { [key in LogType]: string } = {
    [LogType.Info]: 'text-brand-info',
    [LogType.Success]: 'text-brand-success',
    [LogType.Warn]: 'text-yellow-500', // Adjusted for better visibility on dark bg
    [LogType.Error]: 'text-brand-error',
    [LogType.AI]: 'text-brand-gemini',
    // Fix: Add Gemini to the color map to support its log type.
    [LogType.Gemini]: 'text-brand-gemini',
};

const LogDisplay: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="p-4 font-mono text-sm space-y-2 h-full overflow-y-auto" aria-live="polite" aria-atomic="false">
      {logs.map((log, index) => (
        <div key={index} className="flex items-start">
          <span className="text-brand-text-secondary mr-3">{log.timestamp}</span>
          <span className={`font-bold mr-2 ${logColorMap[log.type]}`}>[{log.type}]</span>
          <p className="flex-1 whitespace-pre-wrap text-brand-text-primary">{log.message}</p>
        </div>
      ))}
      <div ref={logEndRef} />
    </div>
  );
};

const TerminalView: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
    const terminalEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="bg-black rounded-lg p-4 font-mono text-sm text-white h-full overflow-y-auto" aria-live="polite" aria-atomic="false">
            <p className="text-green-400">Welcome to AI/AGI/AIM Terminal View [v2.0.0]</p>
            <p className="text-gray-500">Log output below. Newest entries appear last.</p>
            <br/>
            {logs.map((log, index) => (
                <div key={index} className="flex items-start">
                    <span className="text-green-400 mr-2" aria-hidden="true">~ $</span>
                    <span className={`font-bold mr-2 ${logColorMap[log.type]}`}>[{log.type.toUpperCase()}]</span>
                    <p className="flex-1 whitespace-pre-wrap text-gray-300">{log.message}</p>
                </div>
            ))}
             <div className="text-green-400 mt-2" ref={terminalEndRef}>
                <span>~ $ </span><span className="bg-green-400 w-2 h-4 inline-block animate-blink"></span>
            </div>
        </div>
    );
};

export default OutputViewer;