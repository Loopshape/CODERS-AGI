
import React, { useState, useRef } from 'react';
import ProgressBar from './ProgressBar';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { SparklesIcon } from './SparklesIcon';

const ProcessIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>);
const CodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>);
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
  hasEnhancedFile: boolean;
  onGetInstallerScript: () => void;
  onGitPull: (url: string) => void;
  onGitPush: (url: string) => void;
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
        case 'getInstallerScript': return 'Generating installer...';
        case 'gitPull': return 'Pulling from repository...';
        case 'gitPush': return 'Pushing to repository...';
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
    hasEnhancedFile,
    onGetInstallerScript,
    onGitPull,
    onGitPush,
    onCloudAccelerate,
    isLoading,
    loadingAction,
    processingFile,
    progress
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<'ai' | 'system' | 'updates'>('ai');
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

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
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
    <div className="bg-brand-surface rounded-lg border border-brand-border shadow-2xl p-6 sticky top-8">
      <div className="flex border-b border-brand-border mb-6" role="tablist" aria-label="Control Panel Modes">
        <TabButton isActive={activeTab === 'ai'} onClick={() => setActiveTab('ai')}>AI Tools</TabButton>
        <TabButton isActive={activeTab === 'updates'} onClick={() => setActiveTab('updates')}>Updates</TabButton>
        <TabButton isActive={activeTab === 'system'} onClick={() => setActiveTab('system')}>System</TabButton>
      </div>

      <div>
        {activeTab === 'system' && (
            <div className="space-y-6 animate-fade-in">
                <ActionCard 
                    title="Download Installer"
                    description="Downloads the installer script for the 'ai' command-line tool. Run this script in Termux to install the tool into your proot-distro."
                    icon={<SystemIcon className="w-6 h-6 mr-3 text-brand-accent"/>}
                >
                    <ActionButton onClick={onGetInstallerScript} disabled={isLoading} isLoading={loadingAction === 'getInstallerScript'}>
                        Download Installer
                    </ActionButton>
                </ActionCard>

                <ActionCard 
                    title="Scan Environment"
                    description="Performs a scan of the environment, displaying variables, disk usage, and directory listings for diagnostic purposes."
                    icon={<ScanIcon className="w-6 h-6 mr-3 text-brand-info"/>}
                >
                    <ActionButton onClick={onScanEnvironment} disabled={isLoading} isLoading={loadingAction === 'scanEnvironment'}>
                        Scan Environment
                    </ActionButton>
                </ActionCard>

                <ActionCard 
                    title="Improve Local AI"
                    description="Use the last AI-enhanced file as training data to improve the local AI's performance and accuracy."
                    icon={<SparklesIcon className="w-6 h-6 mr-3 text-brand-success"/>}
                >
                    <ActionButton onClick={onImproveLocalAI} disabled={!hasEnhancedFile || isLoading} isLoading={loadingAction === 'improveLocalAI'}>
                       Train Local AI
                    </ActionButton>
                </ActionCard>
            </div>
        )}
        {activeTab === 'ai' && (
          <div className="flex flex-col space-y-6 animate-fade-in">
             <ActionCard title="Direct Input Processing" description="Process raw text with a prompt, or fetch and process content from a URL.">
                <textarea value={prompt} onChange={(e) => { setPrompt(e.target.value); setUrl(''); }} className="w-full h-24 p-3 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="Enter prompt text..." aria-label="Text prompt for AI processing"/>
                <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-brand-border"></div><span className="flex-shrink mx-4 text-brand-text-secondary uppercase text-sm">Or</span><div className="flex-grow border-t border-brand-border"></div></div>
                <input type="url" value={url} onChange={(e) => { setUrl(e.target.value); setPrompt(''); }} className="w-full p-3 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="https://example.com" aria-label="URL for fetching and processing"/>
                <div className="mt-3 space-y-2">
                    <ActionButton onClick={handleProcessInput} disabled={(!prompt.trim() && !url.trim()) || isLoading} isLoading={loadingAction === 'processPrompt' || loadingAction === 'processUrl'}>
                        Process Input
                    </ActionButton>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <ActionButton onClick={() => onUrlEnhance(url)} disabled={!url.trim() || isLoading} isLoading={loadingAction === 'urlEnhance'} icon={<SparklesIcon className="w-5 h-5"/>}>
                            Enhance URL
                        </ActionButton>
                        <ActionButton onClick={() => onTrainFromUrl(url)} disabled={!url.trim() || isLoading} isLoading={loadingAction === 'trainFromUrl'} icon={<SparklesIcon className="w-5 h-5"/>}>
                            Train AI
                        </ActionButton>
                    </div>
                </div>
             </ActionCard>

             <ActionCard title="File Processing" description="Select a file to be processed by Local or Generative AI.">
                <div 
                    onClick={triggerFileSelect} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver} onDrop={handleDrop}
                    className={`flex flex-col justify-center items-center w-full p-4 transition-all bg-brand-bg/50 border-2 border-brand-border border-dashed rounded-lg cursor-pointer hover:border-brand-accent focus:outline-none ${isDragging ? 'border-brand-accent ring-2 ring-brand-accent/50' : ''}`}
                    role="button" tabIndex={0} aria-label="File selection area"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerFileSelect(); } }}
                >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" aria-hidden="true" />
                    {selectedFiles.length === 0 ? (
                         <div className="text-center">
                           <UploadIcon className="w-8 h-8 mx-auto text-brand-text-secondary mb-2"/>
                           <p className="font-medium text-brand-text-secondary">
                             {isDragging ? "Drop files here" : <>Drop files or <span className="text-brand-accent">browse</span></>}
                           </p>
                        </div>
                    ) : (
                        <div className="text-left w-full">
                            <p className="text-brand-text-primary font-medium mb-2">{selectedFiles.length} file(s) selected:</p>
                            <ul className="text-sm text-brand-text-secondary space-y-1 max-h-24 overflow-y-auto">
                               {selectedFiles.map(f => (
                                    <li key={f.name} className="flex items-center justify-between bg-brand-bg/50 p-1.5 rounded">
                                      <span className="truncate pr-2">{f.name} ({formatBytes(f.size)})</span>
                                    </li>
                                  )
                                )}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    <ActionButton onClick={() => onAiCodeReview(selectedFiles[0])} disabled={selectedFiles.length === 0 || isLoading} isLoading={loadingAction === 'aiCodeReview'}>
                        AI Review
                    </ActionButton>
                </div>
            </ActionCard>
          </div>
        )}
        {activeTab === 'updates' && (
            <div className="space-y-6 animate-fade-in">
                 <ActionCard title="Source Control & Updates" description="Pull changes from the remote repository or push local changes. Then, generate an installer for the latest version." icon={<GitIcon className="w-6 h-6 mr-3 text-brand-accent"/>}>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-text-secondary">Repository URL:</label>
                        <input type="text" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="git@github.com:user/repo.git" className="w-full p-2 bg-brand-bg border border-brand-border rounded-md"/>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <ActionButton onClick={() => onGitPull(repoUrl)} disabled={isLoading} isLoading={loadingAction === 'gitPull'} icon={<DownloadIcon className="w-5 h-5"/>}>
                              Pull from Repository
                            </ActionButton>
                            <ActionButton onClick={() => onGitPush(repoUrl)} disabled={isLoading} isLoading={loadingAction === 'gitPush'} icon={<UploadIcon className="w-5 h-5"/>}>
                              Push to Repository
                            </ActionButton>
                        </div>
                    </div>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-brand-border"></div>
                        <span className="flex-shrink mx-4 text-brand-text-secondary uppercase text-sm">Then</span>
                        <div className="flex-grow border-t border-brand-border"></div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-brand-text-secondary">Once updated, download the new installer to apply changes in your environment.</p>
                        <ActionButton onClick={onGetInstallerScript} disabled={isLoading} isLoading={loadingAction === 'getInstallerScript'}>
                          Download Installer
                        </ActionButton>
                    </div>
                </ActionCard>
            </div>
        )}
      </div>
      <div className="h-20 mt-4">
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

const ActionCard: React.FC<{title: string, description: string, children: React.ReactNode, icon?: React.ReactNode}> = ({ title, description, icon, children }) => (
    <div className="p-4 border border-brand-border rounded-lg bg-brand-bg/30">
        <h2 className="text-lg font-semibold text-brand-text-primary flex items-center mb-1">{icon}{title}</h2>
        <p className="text-sm text-brand-text-secondary mb-4">{description}</p>
        <div className="space-y-3">{children}</div>
    </div>
);

interface TabButtonProps { isActive: boolean; onClick: () => void; children: React.ReactNode; }
const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children }) => (
    <button onClick={onClick} className={`flex-1 text-center py-2 px-2 text-sm font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 rounded-t-md ${isActive ? 'bg-brand-surface text-brand-accent' : 'text-brand-text-secondary hover:text-brand-text-primary'}`} role="tab" aria-selected={isActive}>
        {children}
    </button>
);

interface ActionButtonProps { onClick: () => void; disabled: boolean; isLoading: boolean; children: React.ReactNode; icon?: React.ReactNode; }
const ActionButton: React.FC<ActionButtonProps> = ({ onClick, disabled, isLoading, children, icon}) => (
    <button onClick={onClick} disabled={disabled} className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2.5 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center space-x-2 shadow-lg disabled:bg-brand-border disabled:cursor-not-allowed" aria-disabled={disabled}>
        {isLoading ? <SpinnerIcon className="h-5 w-5 text-white animate-spin" /> : <>{icon}{<span>{children}</span>}</>}
    </button>
);

export default ControlPanel;
