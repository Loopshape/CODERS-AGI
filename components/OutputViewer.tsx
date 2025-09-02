import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { LogEntry, LogType, ProcessedFile, CodeReviewReport, CodeIssue } from '../types';
import { CodeIcon } from './icons/CodeIcon';
import { EyeIcon } from '../EyeIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import DownloadButton from './DownloadButton';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import prismLight from 'react-syntax-highlighter/dist/esm/styles/prism/prism';
import { getLocalAiCodeReview } from '../services/localAiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CpuChipIcon } from './icons/CpuChipIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from '../src/RedoIcon';
import { ShareIcon } from '../src/ShareIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CogIcon } from './icons/CogIcon';


interface EditorSettings {
    fontSize: number;
    theme: 'light' | 'dark';
    tabSize: number;
}

interface OutputViewerProps {
  processedOutput: ProcessedFile[] | null;
  logs: LogEntry[];
  isLoading: boolean;
  isLoadingCommand: boolean;
  activeOutput: 'code' | 'preview' | 'logs';
  setActiveOutput: (output: 'code' | 'preview' | 'logs') => void;
  activeFileIndex: number;
  setActiveFileIndex: (index: number) => void;
  onContentChange: (newContent: string, index: number) => void;
  editorSettings: EditorSettings;
  onEditorSettingsChange: (newSettings: Partial<EditorSettings>) => void;
  onCommand: (command: string) => void;
  onUndo: (index: number) => void;
  onRedo: (index: number) => void;
  onRenameFile: (index: number, newName: string) => void;
  onDeleteFile: (index: number) => void;
}

const OutputViewer: React.FC<OutputViewerProps> = ({ 
    processedOutput, 
    logs, 
    isLoading,
    isLoadingCommand,
    activeOutput,
    setActiveOutput,
    activeFileIndex,
    setActiveFileIndex,
    onContentChange,
    editorSettings,
    onEditorSettingsChange,
    onCommand,
    onUndo,
    onRedo,
    onRenameFile,
    onDeleteFile,
}) => {
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

    if (!processedOutput && logs.length === 0 && activeOutput !== 'logs') {
        return <InitialState />;
    }

    const canUndo = currentFile ? currentFile.historyIndex > 0 : false;
    const canRedo = currentFile ? currentFile.historyIndex < currentFile.history.length - 1 : false;

    switch (activeOutput) {
      case 'code':
        return currentFile ? <CodeDisplay content={currentFile.content} fileName={currentFile.fileName} onContentChange={(newContent) => onContentChange(newContent, activeFileIndex)} editorSettings={editorSettings} onEditorSettingsChange={onEditorSettingsChange} onAnalyze={handleAnalyzeWithLocalAI} isAnalyzing={isReviewLoading} onUndo={() => onUndo(activeFileIndex)} onRedo={() => onRedo(activeFileIndex)} canUndo={canUndo} canRedo={canRedo} onRename={(newName) => onRenameFile(activeFileIndex, newName)} /> : <NoContent message="No output to display. Process something first." />;
      case 'preview':
        return currentFile && currentFile.content.trim().startsWith('<') ? <iframe srcDoc={currentFile.content} title="Live Preview" className="w-full h-full bg-white rounded-b-lg" sandbox="allow-scripts allow-forms allow-modals allow-popups" /> : <NoContent message="No HTML content to preview." />;
      case 'logs':
        return <TerminalView logs={logs} onCommand={onCommand} isLoading={isLoadingCommand} />;
      default:
        return <InitialState />;
    }
  };
  
  const isPreviewDisabled = !currentFile || !currentFile.content.trim().startsWith('<');

  return (
    <div className="bg-brand-surface rounded-lg border border-brand-border shadow-2xl flex flex-col h-full shadow-glow-brand">
      <div className="flex border-b border-brand-border shrink-0" role="tablist" aria-label="Output viewer modes">
        <OutputTabButton icon={<CodeIcon />} label="Code" isActive={activeOutput === 'code'} onClick={() => setActiveOutput('code')} disabled={!processedOutput} />
        <OutputTabButton icon={<EyeIcon />} label="Preview" isActive={activeOutput === 'preview'} onClick={() => setActiveOutput('preview')} disabled={isPreviewDisabled}/>
        <OutputTabButton icon={<TerminalIcon />} label="Terminal" isActive={activeOutput === 'logs'} onClick={() => setActiveOutput('logs')} />
      </div>

      {processedOutput && processedOutput.length > 0 && (activeOutput === 'code' || activeOutput === 'preview') && (
        <div className="flex border-b border-brand-border bg-brand-bg/50 px-2 shrink-0 overflow-x-auto" role="tablist" aria-label="Processed files">
          {processedOutput.map((file, index) => (
            <FileTabButton
              key={`${file.fileName}-${index}`}
              fileName={file.fileName}
              isActive={index === activeFileIndex}
              onClick={() => setActiveFileIndex(index)}
              onDelete={() => onDeleteFile(index)}
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

const EditorSettingsPopover: React.FC<{ settings: EditorSettings; onChange: (newSettings: Partial<EditorSettings>); onClose: () => void; triggerRef: React.RefObject<HTMLButtonElement> }> = ({ settings, onChange, onClose, triggerRef }) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, triggerRef]);

    return (
        <div ref={popoverRef} className="absolute top-12 right-0 bg-brand-surface border border-brand-border rounded-lg shadow-xl z-20 w-64 p-4 animate-fade-in">
            <h4 className="text-sm font-semibold text-brand-text-primary mb-3">Editor Settings</h4>
            <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                    <label htmlFor="theme-select" className="text-brand-text-secondary">Theme</label>
                    <select id="theme-select" value={settings.theme} onChange={e => onChange({ theme: e.target.value as 'light' | 'dark' })} className="bg-brand-bg border border-brand-border rounded px-2 py-1 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent w-24">
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                    </select>
                </div>
                 <div className="flex items-center justify-between">
                    <label htmlFor="font-size-input" className="text-brand-text-secondary">Font Size</label>
                    <input type="number" id="font-size-input" value={settings.fontSize} onChange={e => onChange({ fontSize: Number(e.target.value) })} className="bg-brand-bg border border-brand-border rounded px-2 py-1 w-24 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                </div>
                 <div className="flex items-center justify-between">
                    <label htmlFor="tab-size-input" className="text-brand-text-secondary">Tab Size</label>
                    <input type="number" id="tab-size-input" value={settings.tabSize} min="1" max="8" onChange={e => onChange({ tabSize: Number(e.target.value) })} className="bg-brand-bg border border-brand-border rounded px-2 py-1 w-24 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                </div>
            </div>
        </div>
    );
};


const OutputTabButton: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; disabled?: boolean; }> = ({ icon, label, isActive, onClick, disabled = false }) => (
    <button onClick={onClick} className={`flex items-center justify-center space-x-2 flex-1 text-center py-3 px-2 font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-accent/50 border-b-2 ${disabled ? 'text-brand-text-secondary/50 cursor-not-allowed' : isActive ? 'text-brand-accent border-brand-accent' : 'text-brand-text-secondary hover:text-brand-text-primary border-transparent'}`} disabled={disabled} role="tab" aria-selected={isActive}>
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const FileTabButton: React.FC<{ fileName: string; isActive: boolean; onClick: () => void; onDelete: () => void; }> = ({ fileName, isActive, onClick, onDelete }) => {
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
            onDelete();
        }
    };

    return (
        <button
            onClick={onClick}
            className={`py-2 px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 focus:outline-none border-b-2 flex items-center group relative -mb-px ${isActive ? 'text-brand-accent border-brand-accent bg-brand-surface' : 'text-brand-text-secondary hover:text-brand-text-primary border-transparent hover:bg-brand-bg'}`}
            role="tab"
            aria-selected={isActive}
        >
            <span className="truncate max-w-[150px] pr-6">{fileName}</span>
            <div onClick={handleDelete} className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-brand-text-secondary/70 hover:bg-brand-border hover:text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" aria-label={`Delete ${fileName}`}>
                <TrashIcon className="w-3.5 h-3.5" />
            </div>
        </button>
    );
};

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

interface CodeDisplayProps {
  content: string;
  fileName: string;
  onContentChange: (newContent: string) => void;
  editorSettings: EditorSettings;
  onEditorSettingsChange: (newSettings: Partial<EditorSettings>) => void;
  onAnalyze: (content: string) => void;
  isAnalyzing: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onRename: (newName: string) => void;
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({ content, fileName, onContentChange, editorSettings, onEditorSettingsChange, onAnalyze, isAnalyzing, onUndo, onRedo, canUndo, canRedo, onRename }) => {
    const [copied, setCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlighterRef = useRef<HTMLDivElement>(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [editableFileName, setEditableFileName] = useState(fileName);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setEditableFileName(fileName);
        setIsRenaming(false);
    }, [fileName]);

    const handleRenameConfirm = () => {
        if (editableFileName.trim() && editableFileName.trim() !== fileName) {
            onRename(editableFileName.trim());
        }
        setIsRenaming(false);
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleRenameConfirm();
        } else if (e.key === 'Escape') {
            setEditableFileName(fileName);
            setIsRenaming(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareLink = useCallback(() => {
        try {
            const base64Content = btoa(content);
            const url = `${window.location.origin}${window.location.pathname}#/view/${base64Content}`;
            navigator.clipboard.writeText(url);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch (error) {
            console.error("Failed to create share link", error);
        }
    }, [content]);

    const stats = useMemo(() => {
        const lines = content.split('\n').length;
        const words = content.trim().split(/\s+/).filter(Boolean).length;
        const chars = content.length;
        return { lines, words, chars };
    }, [content]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey) {
                if (event.key === 'z') {
                    event.preventDefault();
                    if (event.shiftKey) {
                        onRedo();
                    } else {
                        onUndo();
                    }
                } else if (event.key === 'y') {
                    event.preventDefault();
                    onRedo();
                }
            }
        };
        const textarea = textareaRef.current;
        textarea?.addEventListener('keydown', handleKeyDown);
        return () => textarea?.removeEventListener('keydown', handleKeyDown);
    }, [onUndo, onRedo]);

    const language = getLanguageFromFileName(fileName);
    const themeStyle = editorSettings.theme === 'dark' ? vscDarkPlus : prismLight;
    
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
            <div className="relative flex justify-between items-center p-2 pl-3 bg-brand-surface border-b border-brand-border shrink-0">
                <div className="flex items-center space-x-2 text-sm font-mono text-brand-text-secondary truncate pr-4">
                    {isRenaming ? (
                        <input
                            type="text"
                            value={editableFileName}
                            onChange={(e) => setEditableFileName(e.target.value)}
                            onBlur={handleRenameConfirm}
                            onKeyDown={handleRenameKeyDown}
                            className="bg-brand-bg border border-brand-accent rounded px-2 py-1 outline-none ring-2 ring-brand-accent"
                            autoFocus
                        />
                    ) : (
                        <span className="truncate" title={fileName}>{fileName}</span>
                    )}
                    <button onClick={() => setIsRenaming(!isRenaming)} disabled={isRenaming} className="p-1 rounded hover:bg-brand-border disabled:opacity-50" aria-label="Rename file" title="Rename file">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Actions Group */}
                    <div className="flex items-center space-x-1 bg-brand-bg p-1 rounded-md">
                        <button onClick={handleCopy} className="text-sm px-3 py-1 rounded-md hover:bg-brand-border transition-colors w-24 text-center">{copied ? 'Copied!' : 'Copy'}</button>
                        <DownloadButton content={content} fileName={fileName} />
                    </div>
                    
                    <div className="w-px h-6 bg-brand-border mx-1"></div>
                    
                    {/* AI & History Group */}
                    <div className="flex items-center space-x-1 bg-brand-bg p-1 rounded-md">
                        <button onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded-md hover:bg-brand-border disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Undo" title="Undo (Ctrl+Z)"><UndoIcon className="w-5 h-5"/></button>
                        <button onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded-md hover:bg-brand-border disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Redo" title="Redo (Ctrl+Y)"><RedoIcon className="w-5 h-5"/></button>
                        <div className="w-px h-5 bg-brand-border/50 mx-1"></div>
                        <button onClick={() => onAnalyze(content)} disabled={isAnalyzing} className="p-1.5 rounded-md hover:bg-brand-border disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Analyze with Local AI" title="Analyze with Local AI">
                            {isAnalyzing ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <CpuChipIcon className="w-5 h-5 text-brand-info" />}
                        </button>
                         <button onClick={handleShareLink} className="p-1.5 rounded-md hover:bg-brand-border" aria-label="Share" title={linkCopied ? 'Link Copied!' : 'Get sharable link'}>
                            <ShareIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="w-px h-6 bg-brand-border mx-1"></div>

                    {/* Settings */}
                    <button ref={settingsBtnRef} onClick={() => setIsSettingsOpen(prev => !prev)} className="p-1.5 rounded-md hover:bg-brand-border" aria-label="Editor settings" title="Editor settings">
                        <CogIcon className="w-5 h-5" />
                    </button>
                </div>
                {isSettingsOpen && <EditorSettingsPopover settings={editorSettings} onChange={onEditorSettingsChange} onClose={() => setIsSettingsOpen(false)} triggerRef={settingsBtnRef}/>}
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
    [LogType.Gemini]: 'text-brand-gemini',
};

const TerminalView: React.FC<{ logs: LogEntry[]; onCommand: (cmd: string) => void; isLoading: boolean; }> = ({ logs, onCommand, isLoading }) => {
    const [input, setInput] = useState('');
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onCommand(input);
        setInput('');
    };
    
    const handleTerminalClick = () => {
        inputRef.current?.focus();
    };

    return (
        <div className="bg-brand-bg font-mono text-sm text-white min-h-full flex flex-col" onClick={handleTerminalClick}>
            <div className="flex-grow p-4 overflow-y-auto" aria-live="polite">
                <p className="text-brand-text-secondary">Welcome to the AI Unified Terminal. Type 'help' for commands.</p>
                <br/>
                {logs.map((log, index) => (
                    <div key={index} className="flex items-start">
                        {log.message.startsWith('>') ? (
                            <>
                                <span className="text-brand-accent mr-2" aria-hidden="true">~ $</span>
                                <p className="flex-1 whitespace-pre-wrap text-brand-text-primary">{log.message.substring(2)}</p>
                            </>
                        ) : (
                             <p className={`flex-1 whitespace-pre-wrap ${logColorMap[log.type] || 'text-brand-text-primary'}`}>
                                <span className="text-brand-text-secondary mr-2">{log.timestamp}</span>
                                [{log.type}] {log.message}
                             </p>
                        )}
                    </div>
                ))}
                 <div ref={terminalEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="flex items-center p-2 border-t border-brand-border bg-brand-surface">
                <span className="text-brand-accent mr-2" aria-hidden="true">~ $</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a command or ask AI..."
                    className="flex-grow bg-transparent outline-none text-brand-text-primary placeholder:text-brand-text-secondary"
                    disabled={isLoading}
                    aria-label="Terminal input"
                    autoFocus
                />
                 {isLoading && <SpinnerIcon className="w-4 h-4 animate-spin text-brand-accent ml-2" />}
            </form>
        </div>
    );
};

export default OutputViewer;