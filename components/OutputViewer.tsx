import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LogEntry, LogType, ProcessedFile, CodeReviewReport, CodeIssue } from '../types';
import { useTermuxDetection } from '../hooks/useTermuxDetection';
import { CodeIcon } from './icons/CodeIcon';
import { EyeIcon } from './icons/EyeIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import DownloadButton from './DownloadButton';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// Fix: Use default import for react-syntax-highlighter styles as they are not named exports.
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import prismLight from 'react-syntax-highlighter/dist/esm/styles/prism/prism';
import { getLocalAiCodeReview } from '../services/localAiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CpuChipIcon } from './icons/CpuChipIcon';


interface EditorSettings {
    fontSize: number;
    theme: 'light' | 'dark';
    tabSize: number;
}

interface OutputViewerProps {
  processedOutput: ProcessedFile[] | null;
  logs: LogEntry[];
  isLoading: boolean;
  activeOutput: 'code' | 'preview' | 'logs';
  setActiveOutput: (output: 'code' | 'preview' | 'logs') => void;
  activeFileIndex: number;
  setActiveFileIndex: (index: number) => void;
  onContentChange: (newContent: string, index: number) => void;
  editorSettings: EditorSettings;
  onEditorSettingsChange: (newSettings: Partial<EditorSettings>) => void;
}

const OutputViewer: React.FC<OutputViewerProps> = ({ 
    processedOutput, 
    logs, 
    isLoading,
    activeOutput,
    setActiveOutput,
    activeFileIndex,
    setActiveFileIndex,
    onContentChange,
    editorSettings,
    onEditorSettingsChange
}) => {
  const isTermux = useTermuxDetection();
  const currentFile = processedOutput?.[activeFileIndex];

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewReport, setReviewReport] = useState<CodeReviewReport | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  
  const handleAnalyzeWithLocalAI = async (content: string) => {
      setIsReviewLoading(true);
      setReviewReport(null);
      setReviewError(null);
      setIsReviewModalOpen(true);
      try {
          const report = await getLocalAiCodeReview(content);
          setReviewReport(report);
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
          setReviewError(errorMessage);
      } finally {
          setIsReviewLoading(false);
      }
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSkeleton />;
    }

    if (!processedOutput && logs.length === 0) {
        return <InitialState />;
    }

    switch (activeOutput) {
      case 'code':
        return currentFile ? <CodeDisplay content={currentFile.content} fileName={currentFile.fileName} onContentChange={(newContent) => onContentChange(newContent, activeFileIndex)} editorSettings={editorSettings} onAnalyze={handleAnalyzeWithLocalAI} isAnalyzing={isReviewLoading} /> : <NoContent message="No output to display. Process something first." />;
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
    <div className="bg-brand-surface rounded-lg border border-brand-border shadow-2xl flex flex-col h-[70vh] min-h-[500px] lg:h-[80vh] lg:min-h-[600px]">
      <div className="flex border-b border-brand-border shrink-0" role="tablist" aria-label="Output viewer modes">
        <OutputTabButton icon={<CodeIcon />} label="Processed Output" isActive={activeOutput === 'code'} onClick={() => setActiveOutput('code')} disabled={!processedOutput} />
        <OutputTabButton icon={<EyeIcon />} label="Live Preview" isActive={activeOutput === 'preview'} onClick={() => setActiveOutput('preview')} disabled={isPreviewDisabled}/>
        <OutputTabButton icon={<TerminalIcon />} label={isTermux ? "Terminal" : "Logs"} isActive={activeOutput === 'logs'} onClick={() => setActiveOutput('logs')} />
      </div>

      {activeOutput === 'code' && processedOutput && (
          <EditorSettingsPanel settings={editorSettings} onChange={onEditorSettingsChange} />
      )}

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

      <div className="flex-grow overflow-auto" role="tabpanel">
        {renderContent()}
      </div>

      {isReviewModalOpen && (
          <CodeReviewModal
              report={reviewReport}
              error={reviewError}
              isLoading={isReviewLoading}
              onClose={() => setIsReviewModalOpen(false)}
          />
      )}
    </div>
  );
};

const CodeReviewModal: React.FC<{ report: CodeReviewReport | null; error: string | null; isLoading: boolean; onClose: () => void; }> = ({ report, error, isLoading, onClose }) => {
    const formatIssues = (title: string, icon: string, issues: CodeIssue[] | undefined) => {
        if (!issues || issues.length === 0) {
            return (
                <div>
                    <h4 className="text-md font-semibold text-brand-text-primary mt-4 mb-2 flex items-center">{icon} {title}</h4>
                    <p className="text-sm text-brand-text-secondary">No issues found in this category.</p>
                </div>
            );
        }
        return (
            <div>
                <h4 className="text-md font-semibold text-brand-text-primary mt-4 mb-2 flex items-center">{icon} {title}</h4>
                <ul className="space-y-3 text-sm">
                    {issues.map((issue, index) => (
                        <li key={index} className="p-2 bg-brand-bg/50 rounded-md border border-brand-border/50">
                            <p className="text-brand-text-secondary"><strong className="text-brand-text-primary">Line {issue.line || 'N/A'}:</strong> {issue.description}</p>
                            <p className="mt-1 text-green-400/80"><strong className="text-green-300">Suggestion:</strong> {issue.suggestion}</p>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-brand-surface border border-brand-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-brand-border">
                    <h3 className="text-lg font-bold flex items-center"><CpuChipIcon className="w-6 h-6 mr-2 text-brand-info"/> Local AI Code Review</h3>
                    <button onClick={onClose} className="text-2xl text-brand-text-secondary hover:text-brand-text-primary">&times;</button>
                </header>
                <main className="p-6 overflow-y-auto">
                    {isLoading && <div className="flex justify-center items-center h-48"><SpinnerIcon className="w-10 h-10 animate-spin text-brand-accent"/></div>}
                    {error && <div className="text-brand-error bg-brand-error/10 p-4 rounded-md"><strong>Error:</strong> {error}</div>}
                    {report && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-md font-semibold text-brand-text-primary mb-2 flex items-center">📝 Summary</h4>
                                <p className="text-brand-text-secondary italic">{report.reviewSummary}</p>
                            </div>
                            <div className="border-t border-brand-border my-4"></div>
                            {formatIssues('Potential Bugs', '🐛', report.potentialBugs)}
                            {formatIssues('Security Vulnerabilities', '🛡️', report.securityVulnerabilities)}
                            {formatIssues('Performance Improvements', '⚡', report.performanceImprovements)}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const EditorSettingsPanel: React.FC<{ settings: EditorSettings; onChange: (newSettings: Partial<EditorSettings>) => void }> = ({ settings, onChange }) => {
    return (
        <div className="bg-brand-bg/50 border-b border-brand-border p-2 flex items-center justify-end space-x-4 text-sm">
            <div className="flex items-center space-x-2">
                <label htmlFor="theme-select" className="text-brand-text-secondary">Theme:</label>
                <select id="theme-select" value={settings.theme} onChange={e => onChange({ theme: e.target.value as 'light' | 'dark' })} className="bg-brand-surface border border-brand-border rounded px-2 py-1 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent">
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                </select>
            </div>
             <div className="flex items-center space-x-2">
                <label htmlFor="font-size-input" className="text-brand-text-secondary">Font Size:</label>
                <input type="number" id="font-size-input" value={settings.fontSize} onChange={e => onChange({ fontSize: Number(e.target.value) })} className="bg-brand-surface border border-brand-border rounded px-2 py-1 w-16 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent" />
            </div>
             <div className="flex items-center space-x-2">
                <label htmlFor="tab-size-input" className="text-brand-text-secondary">Tab Size:</label>
                <input type="number" id="tab-size-input" value={settings.tabSize} min="1" max="8" onChange={e => onChange({ tabSize: Number(e.target.value) })} className="bg-brand-surface border border-brand-border rounded px-2 py-1 w-16 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent" />
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

const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
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
        case 'md':
            return 'markdown';
        case 'html':
        case 'xml':
            return 'markup';
        case 'sh':
            return 'bash';
        default:
            return 'clike';
    }
};

const CodeDisplay: React.FC<{ content: string; fileName: string; onContentChange: (newContent: string) => void; editorSettings: EditorSettings; onAnalyze: (content: string) => void; isAnalyzing: boolean; }> = ({ content, fileName, onContentChange, editorSettings, onAnalyze, isAnalyzing }) => {
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlighterRef = useRef<HTMLDivElement>(null);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const stats = useMemo(() => {
        const lines = content.split('\n').length;
        const words = content.trim().split(/\s+/).filter(Boolean).length;
        const chars = content.length;
        return { lines, words, chars };
    }, [content]);

    const language = getLanguageFromFileName(fileName);
    const themeStyle = editorSettings.theme === 'dark' ? vscDarkPlus : prismLight;
    
    // Fix: Type assertion to allow vendor-prefixed properties not in default React CSSProperties.
    const sharedEditorStyles = {
        fontFamily: 'monospace',
        fontSize: `${editorSettings.fontSize}px`,
        lineHeight: 1.5,
        padding: '1rem',
        tabSize: editorSettings.tabSize,
        WebkitTabSize: editorSettings.tabSize,
        MozTabSize: editorSettings.tabSize,
        whiteSpace: 'pre',
        wordBreak: 'keep-all',
        overflowWrap: 'normal'
    } as React.CSSProperties;
    
    useEffect(() => {
        const syncScroll = () => {
            if (textareaRef.current && highlighterRef.current) {
                highlighterRef.current.scrollTop = textareaRef.current.scrollTop;
                highlighterRef.current.scrollLeft = textareaRef.current.scrollLeft;
            }
        };

        const textarea = textareaRef.current;
        textarea?.addEventListener('scroll', syncScroll);
        return () => textarea?.removeEventListener('scroll', syncScroll);
    }, []);

    return (
        <div className="bg-brand-bg rounded-b-lg h-full flex flex-col">
            <div className="flex justify-between items-center p-3 bg-brand-surface border-b border-brand-border shrink-0">
                <span className="text-sm font-mono text-brand-text-secondary">{fileName}</span>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onAnalyze(content)} disabled={isAnalyzing} className="text-sm bg-brand-info/20 text-brand-info px-3 py-1 rounded hover:bg-brand-info hover:text-white transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isAnalyzing ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <CpuChipIcon className="w-4 h-4" />}
                        <span>Analyze Code</span>
                    </button>
                    <button onClick={handleCopy} className="text-sm bg-brand-border/50 px-3 py-1 rounded hover:bg-brand-accent hover:text-white transition-colors">
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <DownloadButton content={content} fileName={fileName} />
                </div>
            </div>
            <div className="relative flex-grow overflow-hidden">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => onContentChange(e.target.value)}
                    spellCheck="false"
                    aria-label={`Code editor for ${fileName}`}
                    style={{
                        ...sharedEditorStyles,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        margin: 0,
                        border: 'none',
                        backgroundColor: 'transparent',
                        resize: 'none',
                        color: 'inherit',
                        WebkitTextFillColor: 'transparent',
                        caretColor: editorSettings.theme === 'dark' ? 'white' : 'black',
                        outline: 'none',
                        zIndex: 1,
                    }}
                />
                <div ref={highlighterRef} style={{overflow: 'auto', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0}}>
                    <SyntaxHighlighter
                        language={language}
                        style={themeStyle}
                        customStyle={{ margin: 0, ...sharedEditorStyles, backgroundColor: 'transparent' }}
                        showLineNumbers={true}
                    >
                        {content + '\n' /* Add newline to prevent scroll jump on last line */}
                    </SyntaxHighlighter>
                </div>
            </div>
            <div className="bg-brand-surface border-t border-brand-border text-xs text-brand-text-secondary px-4 py-1 flex justify-end space-x-4">
                <span>Lines: {stats.lines}</span>
                <span>Words: {stats.words}</span>
                <span>Chars: {stats.chars}</span>
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