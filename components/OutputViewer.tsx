import React from 'react';
import { LogEntry, LogType, ProcessedFile } from '../types';
import { useTermuxDetection } from '../hooks/useTermuxDetection';
import { CodeIcon } from './icons/CodeIcon';
import { EyeIcon } from './icons/EyeIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TerminalIcon } from './icons/TerminalIcon';

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
        return currentFile ? <CodeDisplay content={currentFile.content} fileName={currentFile.fileName} language="bash" /> : <NoContent message="No output to display. Process something first." />;
      case 'preview':
        // A simple check to see if content might be HTML.
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
      <div className="flex border-b border-brand-border shrink-0">
        <OutputTabButton icon={<CodeIcon />} label="Processed Output" isActive={activeOutput === 'code'} onClick={() => setActiveOutput('code')} disabled={!processedOutput} />
        <OutputTabButton icon={<EyeIcon />} label="Live Preview" isActive={activeOutput === 'preview'} onClick={() => setActiveOutput('preview')} disabled={isPreviewDisabled}/>
        <OutputTabButton icon={<TerminalIcon />} label={isTermux ? "Terminal" : "Logs"} isActive={activeOutput === 'logs'} onClick={() => setActiveOutput('logs')} />
      </div>

      {processedOutput && processedOutput.length > 1 && (activeOutput === 'code' || activeOutput === 'preview') && (
        <div className="flex border-b border-brand-border bg-brand-bg px-2 shrink-0 overflow-x-auto">
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

      <div className="p-1 flex-grow overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};


interface OutputTabButtonProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
}

const OutputTabButton: React.FC<OutputTabButtonProps> = ({ icon, label, isActive, onClick, disabled = false }) => {
    const baseClasses = "flex items-center justify-center space-x-2 flex-1 text-center py-3 px-2 font-semibold transition-colors duration-300 focus:outline-none";
    const activeClasses = "text-brand-accent border-b-2 border-brand-accent bg-brand-bg";
    const inactiveClasses = "text-brand-text-secondary hover:text-brand-text-primary";
    const disabledClasses = "text-gray-600 cursor-not-allowed";

    return (
        <button onClick={onClick} className={`${baseClasses} ${disabled ? disabledClasses : (isActive ? activeClasses : inactiveClasses)}`} disabled={disabled}>
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
};

interface FileTabButtonProps {
    fileName: string;
    isActive: boolean;
    onClick: () => void;
}

const FileTabButton: React.FC<FileTabButtonProps> = ({ fileName, isActive, onClick }) => {
    const baseClasses = "py-2 px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 focus:outline-none";
    const activeClasses = "text-brand-accent border-b-2 border-brand-accent";
    const inactiveClasses = "text-brand-text-secondary hover:text-brand-text-primary border-b-2 border-transparent";
    return (
        <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {fileName}
        </button>
    );
};

const LoadingSkeleton: React.FC = () => (
    <div className="p-6 animate-pulse">
        <div className="h-4 bg-brand-border rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-brand-border rounded w-full mb-2"></div>
        <div className="h-4 bg-brand-border rounded w-full mb-2"></div>
        <div className="h-4 bg-brand-border rounded w-3/4 mb-6"></div>
        <div className="h-4 bg-brand-border rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-brand-border rounded w-full mb-2"></div>
        <div className="h-4 bg-brand-border rounded w-5/6"></div>
    </div>
);

const InitialState: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <SparklesIcon className="w-16 h-16 text-brand-border mb-4" />
        <h3 className="text-xl font-bold text-brand-text-primary">Ready to Process</h3>
        <p className="text-brand-text-secondary max-w-md">
            Select a file or enter a prompt and choose an action from the control panel to see the results here.
        </p>
    </div>
);

const NoContent: React.FC<{ message: string }> = ({ message }) => (
     <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <p className="text-brand-text-secondary max-w-md">{message}</p>
    </div>
)

const CodeDisplay: React.FC<{ content: string; fileName: string; language: string; }> = ({ content, fileName, language }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(content);
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-brand-bg rounded-lg h-full flex flex-col">
            <div className="flex justify-between items-center p-3 bg-brand-surface border-b border-brand-border rounded-t-lg">
                <span className="text-sm font-mono text-brand-text-secondary">{fileName}</span>
                <div className="flex items-center space-x-2">
                    <button onClick={handleCopy} className="text-sm bg-brand-border px-3 py-1 rounded hover:bg-brand-accent transition-colors">Copy</button>
                    <button onClick={handleDownload} className="text-sm bg-brand-border px-3 py-1 rounded hover:bg-brand-success transition-colors">Download</button>
                </div>
            </div>
            <pre className="p-4 text-sm overflow-auto flex-grow"><code className={`language-${language}`}>{content}</code></pre>
        </div>
    );
};

const logColorMap: { [key in LogType]: string } = {
    [LogType.Info]: 'text-brand-info',
    [LogType.Success]: 'text-brand-success',
    [LogType.Warn]: 'text-brand-warn',
    [LogType.Error]: 'text-brand-error',
    [LogType.Gemini]: 'text-brand-gemini',
};

const LogDisplay: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
  return (
    <div className="p-4 font-mono text-sm space-y-2 h-full overflow-y-auto">
      {logs.map((log, index) => (
        <div key={index} className="flex items-start">
          <span className="text-brand-text-secondary mr-3">{log.timestamp}</span>
          <span className={`font-bold mr-2 ${logColorMap[log.type]}`}>[{log.type}]</span>
          <p className="flex-1 whitespace-pre-wrap text-brand-text-primary">{log.message}</p>
        </div>
      ))}
    </div>
  );
};

const TerminalView: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
    return (
        <div className="bg-black rounded-lg p-4 font-mono text-sm text-white h-full overflow-y-auto">
            <p className="text-green-400">Welcome to AI/AGI/AIM Terminal View [v1.0.0]</p>
            <p className="text-gray-500">Log output below. Newest entries appear last.</p>
            <br/>
            {logs.map((log, index) => (
                <div key={index} className="flex items-start">
                    <span className="text-gray-500 mr-2">&gt;</span>
                    <span className={`font-bold mr-2 ${logColorMap[log.type]}`}>[{log.type.toUpperCase()}]</span>
                    <p className="flex-1 whitespace-pre-wrap text-gray-300">{log.message}</p>
                </div>
            ))}
             <div className="text-green-400 mt-2">
                <span className="animate-pulse">_</span>
            </div>
        </div>
    );
};


export default OutputViewer;