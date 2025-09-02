
import React, { useState, useRef } from 'react';
import ProgressBar from './ProgressBar';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { SparklesIcon } from './SparklesIcon';
import { CpuChipIcon } from './icons/CpuChipIcon';

const ProcessIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>);
const ScanIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>);
const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>);
const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>);
const GitIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>);
const SystemIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.002 1.11-1.226M10.343 3.94a2.25 2.25 0 013.314 0c.55.224 1.02.684 1.11 1.226m-4.534 0c-.09.542.233 1.084.745 1.458l.743.694c.368.343.83.57 1.33.57h.01c.5 0 .962-.227 1.33-.57l.743-.694c.512-.374.835-.916.745-1.458m-4.534 0S10 3 12 3s1.657.94 1.657.94m-3.314 0c1.096 1.096 2.39 1.096 3.486 0M6.343 12.343a2.25 2.25 0 010-3.182c.55-.55 1.287-.825 2.03-.825h.01c.743 0 1.48.275 2.03.825 1.1 1.1 1.1 2.942 0 4.042-.55.55-1.287.825-2.03.825h-.01a2.25 2.25 0 01-2.03-.825m6.344 0c1.1 1.1 2.942 1.1 4.042 0 .55-.55.825-1.287.825-2.03h-.01a2.25 2.25 0 01-.825-2.03c0-.743.275-1.48.825-2.03.55-.55 1.287-.825 2.03-.825h.01" /></svg>);
const CloneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375v-3.375a1.125 1.125 0 00-1.125-1.125h-1.5a1.125 1.125 0 00-1.125 1.125v3.375" /></svg>
);
const AIToolsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);


interface ControlPanelProps {
  onProcessFiles: (files: File[]) => void;
  onScanEnvironment: () => void;
  onProcessPrompt: (prompt: string) => void;
  onProcessUrl: (url: string) => void;
  onAiEnhance: (file: File) => void;
  onOllamaEnhance: (file: File) => void;
  onAiCodeReview: (file: File) => void;
  onLocalAIEnhance: (file: File) => void;
  onUrlEnhance: (url: string) => void;
  onImproveLocalAI: () => void;
  onTrainFromUrl: (url: string) => void;
  onGenerateExtension: () => void;
  hasEnhancedFile: boolean;
  onGetInstallerScript: () => void;
  onGitPull: (url: string) => void;
  onGitPush: (url: string) => void;
  onGitClone: (url: string) => void;
  onCloudAccelerate: () => void;
  isLoading: boolean;
  loadingAction: string | null;
  processingFile: File | null;
  progress: number;
}

const getLoadingMessage = (action: string | null, file: File | null, selectedFiles: File[]): string => {
    switch (action) {
        case 'processFiles': return `Processing ${selectedFiles.length} file(s)...`;
        case 'localAIEnhance': return `Applying local enhancements to ${file?.name} (can be slow)...`;
        case 'ollamaEnhance': return `Enhancing ${file?.name} with Ollama (can be slow)...`;
        case 'aiEnhance':
        case 'aiCodeReview':
            return `Analyzing ${file?.name} with Gemini AI...`;
        case 'cloudAcceleration': return `Accelerating ${file?.name} with Cloud AI...`;
        case 'scanEnvironment': return 'Scanning environment...';
        case 'processPrompt': return 'Processing prompt with AI...';
        case 'processUrl': return 'Fetching and processing URL...';
        case 'urlEnhance': return `Enhancing content from URL...`;
        case 'trainFromUrl': return `Training AI from URL...`;
        case 'improveLocalAI': return 'Improving local AI model...';
        case 'generateExtension': return 'Generating bash extension with Local AI...';
        case 'getInstallerScript': return 'Generating installer...';
        case 'gitPull': return 'Pulling from repository...';
        case 'gitPush': return 'Pushing to repository...';
        case 'gitClone': return 'Cloning from repository...';
        case 'geminiCommand': return 'Executing AI command...';
        default: return 'Processing...';
    }
};

const ControlPanel: React.FC<ControlPanelProps> = ({ 
    onProcessFiles,
    onScanEnvironment,
    onProcessPrompt,
    onProcessUrl,
    onAiEnhance,
    onOllamaEnhance,
    onAiCodeReview,
    onLocalAIEnhance,
    onUrlEnhance,
    onImproveLocalAI,
    onTrainFromUrl,
    onGenerateExtension,
    hasEnhancedFile,
    onGetInstallerScript,
    onGitPull,
    onGitPush,
    onGitClone,
    onCloudAccelerate,
    isLoading,
    loadingAction,
    processingFile,
    progress
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [repoUrl, setRepoUrl] = useState('git@github.com:Loopshape/CODERS-AGI.git');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };
  
  const triggerFileSelect = () => {
      fileInputRef.current?.click();
  }

  const handleProcessFilesClick = () => {
      if (selectedFiles.length > 0) {
          onProcessFiles(selectedFiles);
      }
  }

  const handleProcessInput = () => {
    if(url.trim()) {
      onProcessUrl(url.trim());
    } else if (prompt.trim()) {
      onProcessPrompt(prompt.trim());
    }
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
    }
  };
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }


  return (
    <div className="bg-brand-surface rounded-lg border border-brand-border shadow-2xl flex flex-col">
      <div className="p-4 space-y-4 overflow-y-auto flex-grow">
          <Accordion title="AI Tools" icon={<AIToolsIcon className="w-6 h-6 mr-3 text-brand-gemini"/>} defaultOpen>
              <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-brand-text-secondary mb-2">Direct Input</h3>
                    <textarea value={prompt} onChange={(e) => { setPrompt(e.target.value); setUrl(''); }} className="w-full h-24 p-3 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="Enter prompt text..." aria-label="Text prompt for AI processing"/>
                    <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-brand-border"></div><span className="flex-shrink mx-4 text-brand-text-secondary uppercase text-xs">Or</span><div className="flex-grow border-t border-brand-border"></div></div>
                    <input type="url" value={url} onChange={(e) => { setUrl(e.target.value); setPrompt(''); }} className="w-full p-3 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="https://example.com" aria-label="URL for fetching and processing"/>
                    <div className="mt-3 space-y-2">
                        <ActionButton onClick={handleProcessInput} disabled={(!prompt.trim() && !url.trim()) || isLoading} isLoading={loadingAction === 'processPrompt' || loadingAction === 'processUrl'}>
                            Process Input
                        </ActionButton>
                        <div className="grid grid-cols-2 gap-2">
                            <ActionButton onClick={() => onUrlEnhance(url)} disabled={!url.trim() || isLoading} isLoading={loadingAction === 'urlEnhance'} icon={<SparklesIcon className="w-5 h-5"/>}>
                                Enhance URL
                            </ActionButton>
                            <ActionButton onClick={() => onTrainFromUrl(url)} disabled={!url.trim() || isLoading} isLoading={loadingAction === 'trainFromUrl'} icon={<SparklesIcon className="w-5 h-5"/>}>
                                Train AI
                            </ActionButton>
                        </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-brand-text-secondary mb-2">File Input</h3>
                    <div 
                        onClick={triggerFileSelect} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver} onDrop={handleDrop}
                        className={`flex flex-col justify-center items-center w-full p-4 transition-all bg-brand-bg/50 border-2 border-brand-border border-dashed rounded-lg cursor-pointer hover:border-brand-accent focus:outline-none ${isDragging ? 'border-brand-accent ring-2 ring-brand-accent/50 bg-brand-accent/10' : ''}`}
                        role="button" tabIndex={0} aria-label="File selection area"
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerFileSelect(); } }}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" aria-hidden="true" />
                        {selectedFiles.length === 0 ? (
                            <div className="text-center">
                              <UploadIcon className="w-8 h-8 mx-auto text-brand-text-secondary mb-2"/>
                              <p className="font-medium text-brand-text-secondary text-sm">
                                {isDragging ? "Drop files here" : <>Drop files or <span className="text-brand-accent">browse</span></>}
                              </p>
                            </div>
                        ) : (
                            <div className="text-left w-full">
                                <ul className="text-sm text-brand-text-secondary space-y-1 max-h-24 overflow-y-auto">
                                  {selectedFiles.map(f => (
                                        <li key={f.name} className="flex items-center justify-between bg-brand-bg/50 p-1.5 rounded text-xs">
                                          <span className="truncate pr-2">{f.name} ({formatBytes(f.size)})</span>
                                        </li>
                                      )
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <ActionButton onClick={handleProcessFilesClick} disabled={selectedFiles.length === 0 || isLoading} isLoading={loadingAction === 'processFiles'} icon={<ProcessIcon className="w-5 h-5"/>}>
                            Batch Process
                        </ActionButton>
                        <ActionButton onClick={() => onLocalAIEnhance(selectedFiles[0])} disabled={selectedFiles.length === 0 || isLoading} isLoading={loadingAction === 'localAIEnhance'}>
                            Local Enhance
                        </ActionButton>
                        <ActionButton onClick={() => onOllamaEnhance(selectedFiles[0])} disabled={selectedFiles.length === 0 || isLoading} isLoading={loadingAction === 'ollamaEnhance'}>
                            Ollama Enhance
                        </ActionButton>
                        <ActionButton onClick={() => onAiEnhance(selectedFiles[0])} disabled={selectedFiles.length === 0 || isLoading} isLoading={loadingAction === 'aiEnhance'}>
                            AI Enhance
                        </ActionButton>
                        <ActionButton onClick={() => onAiCodeReview(selectedFiles[0])} disabled={selectedFiles.length === 0 || isLoading} isLoading={loadingAction === 'aiCodeReview'} fullWidth>
                            AI Review
                        </ActionButton>
                    </div>
                  </div>
              </div>
          </Accordion>
          
          <Accordion title="Updates" icon={<GitIcon className="w-6 h-6 mr-3 text-brand-accent"/>}>
              <p className="text-sm text-brand-text-secondary mb-3">Clone, pull, or push changes, then generate an installer for the latest version.</p>
              <div className="space-y-3">
                  <div>
                      <label className="text-xs font-medium text-brand-text-secondary">Repository URL:</label>
                      <input type="text" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="git@github.com:user/repo.git" className="w-full text-sm p-2 bg-brand-bg border border-brand-border rounded-md"/>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                      <ActionButton onClick={() => onGitClone(repoUrl)} disabled={!repoUrl.trim() || isLoading} isLoading={loadingAction === 'gitClone'} icon={<CloneIcon className="w-5 h-5"/>}>
                        Clone
                      </ActionButton>
                      <ActionButton onClick={() => onGitPull(repoUrl)} disabled={!repoUrl.trim() || isLoading} isLoading={loadingAction === 'gitPull'} icon={<DownloadIcon className="w-5 h-5"/>}>
                        Pull
                      </ActionButton>
                      <ActionButton onClick={() => onGitPush(repoUrl)} disabled={!repoUrl.trim() || isLoading} isLoading={loadingAction === 'gitPush'} icon={<UploadIcon className="w-5 h-5"/>}>
                        Push
                      </ActionButton>
                  </div>
                  <div className="relative flex py-1 items-center"><div className="flex-grow border-t border-brand-border"></div><span className="flex-shrink mx-4 text-brand-text-secondary uppercase text-xs">Then</span><div className="flex-grow border-t border-brand-border"></div></div>
                  <ActionButton onClick={onGetInstallerScript} disabled={isLoading} isLoading={loadingAction === 'getInstallerScript'}>
                    Download New Installer
                  </ActionButton>
              </div>
          </Accordion>

          <Accordion title="System" icon={<SystemIcon className="w-6 h-6 mr-3 text-brand-info"/>}>
            <div className="space-y-2">
              <ActionButton onClick={onGetInstallerScript} disabled={isLoading} isLoading={loadingAction === 'getInstallerScript'}>
                Download Installer
              </ActionButton>
              <ActionButton onClick={onScanEnvironment} disabled={isLoading} isLoading={loadingAction === 'scanEnvironment'}>
                  Scan Environment
              </ActionButton>
               <ActionButton onClick={onGenerateExtension} disabled={isLoading} isLoading={loadingAction === 'generateExtension'} icon={<CpuChipIcon className="w-5 h-5"/>}>
                  Generate Extension
              </ActionButton>
              <ActionButton onClick={onImproveLocalAI} disabled={!hasEnhancedFile || isLoading} isLoading={loadingAction === 'improveLocalAI'}>
                  Train Local AI
              </ActionButton>
            </div>
          </Accordion>
      </div>

      <div className="p-4 border-t border-brand-border/50 mt-auto shrink-0 h-24">
        {isLoading && (
            <div className="animate-fade-in text-center space-y-2">
                <p className="text-sm text-brand-text-secondary truncate px-2">
                    {getLoadingMessage(loadingAction, processingFile, selectedFiles)}
                </p>
                <ProgressBar progress={progress} />
                {(loadingAction === 'ollamaEnhance' || loadingAction === 'localAIEnhance') && (
                  <div className="pt-2">
                    <button
                      onClick={onCloudAccelerate}
                      className="text-sm text-brand-gemini font-semibold hover:text-brand-accent transition-colors duration-200 animate-pulse"
                    >
                      ⚡ This is slow... Accelerate with Cloud AI?
                    </button>
                  </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

const Accordion: React.FC<{title: string, children: React.ReactNode, icon?: React.ReactNode, defaultOpen?: boolean}> = ({ title, icon, children, defaultOpen = false }) => (
    <details className="control-panel-accordion border border-brand-border bg-brand-bg/30 rounded-lg" open={defaultOpen}>
        <summary className="text-lg font-semibold text-brand-text-primary flex items-center p-3 list-none">
          <span className="text-brand-accent mr-2 transition-transform duration-200">▸</span>
          {icon}
          {title}
        </summary>
        <div className="p-3 border-t border-brand-border">
          {children}
        </div>
    </details>
);

interface ActionButtonProps { onClick: () => void; disabled: boolean; isLoading: boolean; children: React.ReactNode; icon?: React.ReactNode; fullWidth?: boolean; }
const ActionButton: React.FC<ActionButtonProps> = ({ onClick, disabled, isLoading, children, icon, fullWidth}) => (
    <button onClick={onClick} disabled={disabled} className={`w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-3 text-sm rounded-lg transition duration-300 ease-in-out flex items-center justify-center space-x-2 shadow-lg disabled:bg-brand-border disabled:cursor-not-allowed ${fullWidth ? 'col-span-2' : ''}`} aria-disabled={disabled}>
        {isLoading ? <SpinnerIcon className="h-5 w-5 text-white animate-spin" /> : <>{icon}{<span>{children}</span>}</>}
    </button>
);

export default ControlPanel;
