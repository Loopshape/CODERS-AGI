

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { LogEntry, LogType, ProcessedFile, CodeReviewReport, CodeIssue } from '../types';
import { CodeIcon } from './icons/CodeIcon';
import { EyeIcon } from './icons/EyeIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import DownloadButton from './DownloadButton';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import prismLight from 'react-syntax-highlighter/dist/esm/styles/prism/prism';
import { getLocalAiCodeReview } from '../services/localAiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CpuChipIcon } from './icons/CpuChipIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { ShareIcon } from './icons/ShareIcon';
import { PencilIcon } from './PencilIcon';
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

      <div className="flex-grow min-h-0 relative">
        {renderContent()}
      </div>

      {isReviewModalOpen && <LocalAIReviewModal report={reviewReport} error={reviewError} isLoading={isReviewLoading} onClose={() => setIsReviewModalOpen(false)} />}
    </div>
  );
};

const OutputTabButton: React.FC<{ icon: JSX.Element; label: string; isActive: boolean; onClick: () => void; disabled?: boolean }> = ({ icon, label, isActive, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled} className={`flex items-center space-x-2 flex-1 justify-center py-2.5 px-4 font-semibold transition-colors duration-200 border-b-2 focus:outline-none disabled:text-brand-border disabled:cursor-not-allowed ${isActive ? 'text-brand-accent border-brand-accent' : 'text-brand-text-secondary hover:text-brand-text-primary border-transparent'}`} role="tab" aria-selected={isActive} aria-disabled={disabled}>
    {React.cloneElement(icon, { className: 'w-5 h-5' })}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const FileTabButton: React.FC<{ fileName: string; isActive: boolean; onClick: () => void; onDelete: () => void; }> = ({ fileName, isActive, onClick, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent tab selection when clicking delete
    onDelete();
  };
  return (
    <button onClick={onClick} className={`group flex items-center space-x-2 text-sm px-3 py-1.5 border-b-2 whitespace-nowrap ${isActive ? 'text-brand-text-primary bg-brand-surface border-brand-accent' : 'text-brand-text-secondary hover:bg-brand-bg border-transparent'}`} role="tab" aria-selected={isActive}>
      <span>{fileName}</span>
      <button onClick={handleDelete} className="text-brand-text-secondary hover:text-brand-error transition-opacity opacity-50 group-hover:opacity-100" aria-label={`Delete ${fileName}`}>
        &times;
      </button>
    </button>
  );
}

const CodeDisplay: React.FC<{ content: string; fileName: string; onContentChange: (newContent: string) => void; editorSettings: EditorSettings; onEditorSettingsChange: (newSettings: Partial<EditorSettings>) => void; onAnalyze: (content: string) => void; isAnalyzing: boolean; onUndo: ()=>void; onRedo: ()=>void; canUndo: boolean; canRedo: boolean; onRename: (newName: string) => void; }> = ({ content, fileName, onContentChange, editorSettings, onEditorSettingsChange, onAnalyze, isAnalyzing, onUndo, onRedo, canUndo, canRedo, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(fileName);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
    }
  }, [isEditing]);

  const handleRename = () => {
    if (tempName.trim() && tempName !== fileName) {
      onRename(tempName);
    }
    setIsRenaming(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
            setIsSettingsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const language = useMemo(() => {
    const extension = fileName.split('.').pop() || '';
    const langMap: { [key: string]: string } = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'jsx',
      tsx: 'tsx',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
      sh: 'bash',
      py: 'python',
      sql: 'sql',
      java: 'java',
    };
    return langMap[extension] || 'plaintext';
  }, [fileName]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b border-brand-border bg-brand-bg/50 shrink-0">
        <div className="flex items-center space-x-2">
            {isRenaming ? (
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                className="bg-brand-bg text-sm p-1 rounded border border-brand-accent"
                autoFocus
              />
            ) : (
              <button onClick={() => setIsRenaming(true)} className="flex items-center space-x-2 p-1 rounded hover:bg-brand-border" title="Rename File">
                  <span className="text-sm font-semibold">{fileName}</span>
                  <PencilIcon className="w-4 h-4" />
              </button>
            )}
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => onAnalyze(content)} disabled={isAnalyzing} className="text-sm flex items-center space-x-1 px-2 py-1 rounded hover:bg-brand-border disabled:opacity-50" title="Review with Local AI">
            {isAnalyzing ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <CpuChipIcon className="w-4 h-4 text-brand-info"/>}
            <span>Analyze</span>
          </button>
          <button onClick={onUndo} disabled={!canUndo} className="p-1 rounded hover:bg-brand-border disabled:opacity-50" title="Undo"><UndoIcon className="w-4 h-4"/></button>
          <button onClick={onRedo} disabled={!canRedo} className="p-1 rounded hover:bg-brand-border disabled:opacity-50" title="Redo"><RedoIcon className="w-4 h-4"/></button>
          <DownloadButton content={content} fileName={fileName} />
           <div className="relative" ref={settingsRef}>
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-1 rounded hover:bg-brand-border" title="Editor Settings"><CogIcon className="w-5 h-5"/></button>
             {isSettingsOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-brand-surface border border-brand-border rounded-lg shadow-xl z-10 p-3 space-y-3">
                    <div>
                        <label className="text-xs">Font Size: {editorSettings.fontSize}px</label>
                        <input type="range" min="10" max="24" value={editorSettings.fontSize} onChange={(e) => onEditorSettingsChange({ fontSize: parseInt(e.target.value) })} className="w-full h-1 bg-brand-border rounded-lg appearance-none cursor-pointer"/>
                    </div>
                    <div>
                        <label className="text-xs">Tab Size</label>
                         <input type="number" min="2" max="8" step="2" value={editorSettings.tabSize} onChange={(e) => onEditorSettingsChange({ tabSize: parseInt(e.target.value) })} className="w-full bg-brand-bg border border-brand-border rounded p-1"/>
                    </div>
                </div>
             )}
           </div>
        </div>
      </div>
      <div className="flex-grow overflow-auto relative" onDoubleClick={() => setIsEditing(true)}>
          {isEditing ? (
              <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => onContentChange(e.target.value)}
                  onBlur={() => setIsEditing(false)}
                  className="absolute inset-0 w-full h-full bg-[#1e1e1e] text-white p-4 font-mono whitespace-pre resize-none focus:outline-none"
                  style={{ fontSize: `${editorSettings.fontSize}px`, tabSize: editorSettings.tabSize, MozTabSize: editorSettings.tabSize, OTabSize: editorSettings.tabSize }}
              />
          ) : (
            <SyntaxHighlighter language={language} style={vscDarkPlus} showLineNumbers customStyle={{ margin: 0, height: '100%', fontSize: `${editorSettings.fontSize}px` }} codeTagProps={{style: {fontFamily: 'monospace'}}} >
                {content}
            </SyntaxHighlighter>
          )}
      </div>
      <div className="text-xs text-brand-text-secondary text-center py-1 border-t border-brand-border bg-brand-bg/50 shrink-0">
        {isEditing ? 'Editing file... (blur to save)' : 'Double-click code to edit'}
      </div>
    </div>
  );
};

const TerminalView: React.FC<{ logs: LogEntry[], onCommand: (command: string) => void, isLoading: boolean }> = ({ logs, onCommand, isLoading }) => {
  const endOfLogsRef = useRef<HTMLDivElement | null>(null);
  const [command, setCommand] = useState('');

  useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
        onCommand(command);
        setCommand('');
    }
  };

  const logTypeClasses: { [key in LogType]: string } = {
    [LogType.Info]: 'text-brand-text-secondary',
    [LogType.Success]: 'text-brand-success',
    [LogType.Warn]: 'text-yellow-400',
    [LogType.Error]: 'text-brand-error',
    [LogType.AI]: 'text-brand-info',
    [LogType.Gemini]: 'text-brand-gemini',
  };

  return (
    <div className="flex flex-col h-full bg-black font-mono text-sm">
        <div className="flex-grow overflow-y-auto p-4 space-y-2">
            {logs.map((log, index) => (
            <div key={index} className="flex">
                <span className="text-gray-500 mr-4">{log.timestamp}</span>
                <span className={`font-bold w-16 ${logTypeClasses[log.type]}`}>{`[${log.type}]`}</span>
                <p className={`flex-1 whitespace-pre-wrap ${logTypeClasses[log.type]}`}>{log.message}</p>
            </div>
            ))}
            <div ref={endOfLogsRef} />
        </div>
        <form onSubmit={handleCommandSubmit} className="flex items-center p-2 border-t border-brand-border shrink-0">
          <span className="text-brand-accent mr-2">{'>'}</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-brand-text-primary"
            placeholder="Type a command and press Enter..."
            disabled={isLoading}
          />
        </form>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="p-4 space-y-3 animate-pulse">
    <div className="h-4 bg-brand-border rounded w-1/4"></div>
    <div className="h-3 bg-brand-border rounded w-full"></div>
    <div className="h-3 bg-brand-border rounded w-5/6"></div>
    <div className="h-3 bg-brand-border rounded w-3/4"></div>
  </div>
);

const NoContent: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center h-full text-brand-text-secondary text-center p-4">
        <p>{message}</p>
    </div>
);

const InitialState = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-brand-text-secondary p-8">
      <CodeIcon className="w-16 h-16 mb-4 text-brand-border" />
      <h2 className="text-xl font-bold text-brand-text-primary mb-2">AI / AGI / AIM Unified Tool</h2>
      <p>Your processed files, logs, and previews will appear here.</p>
      <p>Use the control panel on the left to get started.</p>
  </div>
);

const formatReviewAsMarkdown = (report: CodeReviewReport, fileName: string): string => {
    let markdown = `# Local AI Code Review: ${fileName}\n\n`;
    markdown += `## 📝 Summary\n${report.reviewSummary}\n\n`;

    const formatIssues = (title: string, icon: string, issues: CodeIssue[]): string => {
        if (!issues || issues.length === 0) return `## ${icon} ${title}\nNo issues found.\n\n`;
        let section = `## ${icon} ${title}\n`;
        issues.forEach(issue => {
            section += `- **Line ${issue.line || 'N/A'}:** ${issue.description}\n`;
            section += `  - **Suggestion:** \`${issue.suggestion}\`\n\n`;
        });
        return section;
    };

    markdown += formatIssues('🐛 Potential Bugs', 'bug', report.potentialBugs);
    markdown += formatIssues('🛡️ Security Vulnerabilities', 'shield', report.securityVulnerabilities);
    markdown += formatIssues('⚡ Performance Improvements', 'zap', report.performanceImprovements);

    return markdown;
};

const LocalAIReviewModal: React.FC<{ report: CodeReviewReport | null; error: string | null; isLoading: boolean; onClose: () => void }> = ({ report, error, isLoading, onClose }) => {
    return (
        <div className="absolute inset-0 bg-black/70 z-20 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-brand-surface border border-brand-border rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-3 border-b border-brand-border">
                    <div className="flex items-center space-x-2">
                        <CpuChipIcon className="w-6 h-6 text-brand-info" />
                        <h3 className="font-bold">Local AI Code Review</h3>
                    </div>
                    <button onClick={onClose} className="text-2xl text-brand-text-secondary hover:text-brand-text-primary">&times;</button>
                </header>
                <main className="flex-grow p-4 overflow-y-auto">
                    {isLoading && <div className="flex items-center justify-center h-full"><SpinnerIcon className="w-12 h-12 animate-spin text-brand-info"/></div>}
                    {error && <div className="text-brand-error bg-brand-error/10 p-4 rounded-md">{error}</div>}
                    {report && (
                        <SyntaxHighlighter language="markdown" style={vscDarkPlus} customStyle={{ margin: 0, backgroundColor: 'transparent' }}>
                            {formatReviewAsMarkdown(report, "current file")}
                        </SyntaxHighlighter>
                    )}
                </main>
            </div>
        </div>
    );
};

export default OutputViewer;
