
import React, { useState, useRef } from 'react';
import ProgressBar from './ProgressBar';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { SparklesIcon } from './icons/SparklesIcon';

// --- Icon Components ---
const ProcessIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>);
const ChipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5m0 16.5v-1.5m3.75-12H21m-18 0h1.5m15 3.75H21m-18 0h1.5M12 21v-1.5m0-16.5V3" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75A5.25 5.25 0 006.75 12a5.25 5.25 0 005.25 5.25a5.25 5.25 0 005.25-5.25A5.25 5.25 0 0012 6.75z" /></svg>);
const CodeReviewIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>);
const ScanIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>);
const BrainIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.456-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" /></svg>);
const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>);
const RepoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>);
const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
const GitCommitIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>);
const PushIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>);


interface ControlPanelProps {
  onProcessFiles: (files: File[]) => void;
  onScanEnvironment: () => void;
  onProcessPrompt: (prompt: string) => void;
  onProcessUrl: (url: string) => void;
  onUrlEnhance: (url: string) => void;
  onGeminiEnhance: (file: File) => void;
  onGeminiCodeReview: (file: File) => void;
  onLocalAIEnhance: (file: File) => void;
  onImproveLocalAI: () => void;
  hasEnhancedFile: boolean;
  onGetInstallerScript: () => void;
  onGitInit: () => void;
  onGitAdd: (files: string) => void;
  onGitCommit: (message: string) => void;
  onGitPush: (remote: string, branch: string) => void;
  isLoading: boolean;
  loadingAction: string | null;
  processingFile: File | null;
  progress: number;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
    onProcessFiles, 
    onScanEnvironment,
    onProcessPrompt,
    onProcessUrl,
    onUrlEnhance,
    onGeminiEnhance,
    onGeminiCodeReview,
    onLocalAIEnhance,
    onImproveLocalAI,
    hasEnhancedFile,
    onGetInstallerScript,
    onGitInit,
    onGitAdd,
    onGitCommit,
    onGitPush,
    isLoading,
    loadingAction,
    processingFile,
    progress
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<'ai' | 'agi' | 'git' | 'prompt' | 'installer'>('ai');
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Git state
  const [filesToAdd, setFilesToAdd] = useState('.');
  const [commitMessage, setCommitMessage] = useState('');
  const [remoteName, setRemoteName] = useState('origin');
  const [branchName, setBranchName] = useState('main');

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

  const handleGeminiEnhanceClick = () => {
    if (selectedFiles.length > 0) {
        onGeminiEnhance(selectedFiles[0]);
    }
  }

  const handleGeminiCodeReviewClick = () => {
    if (selectedFiles.length > 0) {
        onGeminiCodeReview(selectedFiles[0]);
    }
  }

  const handleLocalAIEnhanceClick = () => {
    if (selectedFiles.length > 0) {
        onLocalAIEnhance(selectedFiles[0]);
    }
  }

  const handleProcessPromptClick = () => {
      if (prompt.trim()) {
          onProcessPrompt(prompt);
      }
  }
  
  const handleProcessUrlClick = () => {
      if (url.trim()) {
          onProcessUrl(url);
      }
  }

  const handleUrlEnhanceClick = () => {
    if (url.trim()) {
        onUrlEnhance(url);
    }
  }

  const handleGitInitClick = () => { onGitInit(); };
  const handleGitAddClick = () => { if (filesToAdd.trim()) onGitAdd(filesToAdd); };
  const handleGitCommitClick = () => { if (commitMessage.trim()) onGitCommit(commitMessage); };
  const handleGitPushClick = () => { if (remoteName.trim() && branchName.trim()) onGitPush(remoteName, branchName); };


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
    e.stopPropagation(); // Necessary to allow drop
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
        <TabButton isActive={activeTab === 'ai'} onClick={() => setActiveTab('ai')}>AI Modes</TabButton>
        <TabButton isActive={activeTab === 'agi'} onClick={() => setActiveTab('agi')}>AGI Modes</TabButton>
        <TabButton isActive={activeTab === 'git'} onClick={() => setActiveTab('git')}>Git</TabButton>
        <TabButton isActive={activeTab === 'prompt'} onClick={() => setActiveTab('prompt')}>Direct Prompt</TabButton>
        <TabButton isActive={activeTab === 'installer'} onClick={() => setActiveTab('installer')}>Installer</TabButton>
      </div>

      <div className="min-h-[420px]">
        {activeTab === 'installer' && (
            <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-brand-accent">CODERS-AGI Self-Installer</h2>
                    <p className="text-brand-text-secondary mt-1">Sets up a persistent, auto-restarting local server environment.</p>
                </div>
                
                <StepCard step={1} title="Generate & Run Installer">
                  <p className="text-sm text-brand-text-secondary mb-4">
                    This script will clone the repository, install dependencies (including Node.js), and set up the server.
                  </p>
                  <ActionButton onClick={onGetInstallerScript} disabled={isLoading} isLoading={loadingAction === 'getInstallerScript'}>
                      Generate Installer Script
                  </ActionButton>
                  <CodeSnippet commands={[
                      '# Download the script from the output viewer as install.sh',
                      'chmod +x install.sh',
                      './install.sh'
                  ]} />
                </StepCard>

                <StepCard step={2} title="Usage">
                    <p className="text-sm text-brand-text-secondary mb-4">
                        The installer creates new commands and runs a server on localhost:8888. It will attempt to auto-start on new shell sessions.
                    </p>
                    <CodeSnippet commands={[
                        '# Start the server and attach to its session',
                        'coders-agi',
                        '# Stop the background server session',
                        'coders-agi-stop'
                    ]} />
                </StepCard>
            </div>
        )}
        {activeTab === 'ai' && (
          <div className="flex flex-col space-y-6 animate-fade-in">
            <div>
                <h2 className="text-xl font-semibold text-brand-text-primary mb-3">1. Select File(s)</h2>
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
                           <p className="text-xs text-brand-text-secondary mt-1">Select one or more files for processing</p>
                        </div>
                    ) : (
                        <div className="text-left w-full">
                            <p className="text-brand-text-primary font-medium mb-2">{selectedFiles.length} file(s) selected:</p>
                            <ul className="text-sm text-brand-text-secondary space-y-1 max-h-24 overflow-y-auto">
                               {selectedFiles.map(f => {
                                  const isProcessingThisFile = 
                                    (loadingAction === 'geminiEnhance' && processingFile?.name === f.name) ||
                                    (loadingAction === 'geminiCodeReview' && processingFile?.name === f.name) ||
                                    (loadingAction === 'localAIEnhance' && processingFile?.name === f.name);
                                  return (
                                    <li key={f.name} className="flex items-center justify-between bg-brand-bg/50 p-1.5 rounded">
                                      <div className="flex items-center min-w-0">
                                        <span className="truncate pr-2">{f.name}</span>
                                        <span className="text-xs text-brand-text-secondary/70 flex-shrink-0">({formatBytes(f.size)})</span>
                                      </div>
                                      {isProcessingThisFile && <SpinnerIcon className="w-4 h-4 text-brand-accent flex-shrink-0 animate-spin" />}
                                    </li>
                                  );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            
            <div>
                <h2 className="text-xl font-semibold text-brand-text-primary">2. Choose Action</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <ActionButton onClick={handleProcessFilesClick} disabled={selectedFiles.length === 0 || isLoading} isLoading={loadingAction === 'processFiles'} icon={<ProcessIcon className="w-5 h-5"/>}>
                    Process File(s)
                  </ActionButton>
                  <ActionButton onClick={handleLocalAIEnhanceClick} disabled={selectedFiles.length === 0 || isLoading} isLoading={loadingAction === 'localAIEnhance'} icon={<ChipIcon className="w-5 h-5"/>} isLocal>
                    Local AI Enhance
                  </ActionButton>
                  <ActionButton onClick={handleGeminiEnhanceClick} disabled={selectedFiles.length === 0 || isLoading} isLoading={loadingAction === 'geminiEnhance'} icon={<SparklesIcon className="w-5 h-5"/>} isGemini>
                    Gemini AI Enhance
                  </ActionButton>
                  <ActionButton onClick={handleGeminiCodeReviewClick} disabled={selectedFiles.length === 0 || isLoading} isLoading={loadingAction === 'geminiCodeReview'} icon={<CodeReviewIcon className="w-5 h-5"/>} isGeminiReview>
                    Gemini Code Review
                  </ActionButton>
                  <ActionButton onClick={onScanEnvironment} disabled={isLoading} isLoading={loadingAction === 'scanEnvironment'} icon={<ScanIcon className="w-5 h-5"/>}>
                    Scan Environment
                  </ActionButton>
                </div>
            </div>
            
            <div>
                <h2 className="text-xl font-semibold text-brand-text-primary">3. AI Training</h2>
                <p className="text-sm text-brand-text-secondary mt-1 mb-3">Use the output of "Gemini AI Enhance" to improve the local model.</p>
                <ActionButton onClick={onImproveLocalAI} disabled={!hasEnhancedFile || isLoading} isLoading={loadingAction === 'improveLocalAI'} icon={<BrainIcon className="w-5 h-5"/>}>
                    Improve Local AI
                </ActionButton>
            </div>
          </div>
        )}
        {activeTab === 'agi' && (
            <div className="space-y-4 animate-fade-in">
                 <SimulationPlaceholder title="Watch Mode (+/~)" message="This simulates watching a folder for file changes. This functionality requires filesystem access and cannot be implemented in the browser." />
                 <SimulationPlaceholder title="Virtual Screenshot (-)" message="This simulates generating a virtual screenshot of a specified aspect ratio." />
            </div>
        )}
         {activeTab === 'git' && (
          <div className="flex flex-col space-y-4 animate-fade-in">
            <GitStep title="Initialize Repository" icon={<RepoIcon className="w-5 h-5 mr-2"/>}>
              <ActionButton onClick={handleGitInitClick} disabled={isLoading} isLoading={loadingAction === 'gitInit'}>
                git init
              </ActionButton>
            </GitStep>
            
            <GitStep title="Stage Changes" icon={<PlusIcon className="w-5 h-5 mr-2"/>}>
               <input type="text" value={filesToAdd} onChange={(e) => setFilesToAdd(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="e.g., '.' or 'src/index.js'" aria-label="Files to stage for git add"/>
              <ActionButton onClick={handleGitAddClick} disabled={!filesToAdd.trim() || isLoading} isLoading={loadingAction === 'gitAdd'}>
                git add
              </ActionButton>
            </GitStep>

            <GitStep title="Commit" icon={<GitCommitIcon className="w-5 h-5 mr-2"/>}>
              <input type="text" value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="Your commit message" aria-label="Git commit message"/>
              <ActionButton onClick={handleGitCommitClick} disabled={!commitMessage.trim() || isLoading} isLoading={loadingAction === 'gitCommit'}>
                git commit
              </ActionButton>
            </GitStep>

            <GitStep title="Push to Remote" icon={<PushIcon className="w-5 h-5 mr-2"/>}>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={remoteName} onChange={(e) => setRemoteName(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none" placeholder="Remote (e.g., origin)" aria-label="Git remote name" />
                <input type="text" value={branchName} onChange={(e) => setBranchName(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none" placeholder="Branch (e.g., main)" aria-label="Git branch name" />
              </div>
              <ActionButton onClick={handleGitPushClick} disabled={!remoteName.trim() || !branchName.trim() || isLoading} isLoading={loadingAction === 'gitPush'}>
                git push
              </ActionButton>
            </GitStep>
          </div>
        )}
        {activeTab === 'prompt' && (
            <div className="flex flex-col space-y-4 p-4 border border-brand-border rounded-lg bg-brand-bg/30 animate-fade-in">
                <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-brand-text-primary">From Text Prompt</h2>
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full h-28 p-3 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="Enter prompt text or file content here..." aria-label="Text prompt for AI processing"/>
                    <ActionButton onClick={handleProcessPromptClick} disabled={!prompt.trim() || isLoading} isLoading={loadingAction === 'processPrompt'}>
                        Process Text Prompt
                    </ActionButton>
                </div>

                <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-brand-border"></div><span className="flex-shrink mx-4 text-brand-text-secondary uppercase text-sm">Or</span><div className="flex-grow border-t border-brand-border"></div></div>

                <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-brand-text-primary">From URL</h2>
                    <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full p-3 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="https://example.com" aria-label="URL for fetching and processing"/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ActionButton onClick={handleProcessUrlClick} disabled={!url.trim() || isLoading} isLoading={loadingAction === 'processUrl'}>
                            Fetch & Process
                        </ActionButton>
                        <ActionButton onClick={handleUrlEnhanceClick} disabled={!url.trim() || isLoading} isLoading={loadingAction === 'urlEnhance'} isGemini icon={<SparklesIcon className="w-5 h-5"/>}>
                            URL Enhance
                        </ActionButton>
                    </div>
                </div>
            </div>
        )}
      </div>
      <div className="h-8 mt-4">
        {isLoading && <ProgressBar progress={progress} />}
      </div>
    </div>
  );
};


interface TabButtonProps { isActive: boolean; onClick: () => void; children: React.ReactNode; }
const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children }) => (
    <button onClick={onClick} className={`flex-1 text-center py-2 px-2 text-sm font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 rounded-t-md ${isActive ? 'bg-brand-surface text-brand-accent' : 'text-brand-text-secondary hover:text-brand-text-primary'}`} role="tab" aria-selected={isActive}>
        {children}
    </button>
);

interface ActionButtonProps { onClick: () => void; disabled: boolean; isLoading: boolean; children: React.ReactNode; isGemini?: boolean; isGeminiReview?: boolean; isLocal?: boolean; icon?: React.ReactNode; }
const ActionButton: React.FC<ActionButtonProps> = ({ onClick, disabled, isLoading, children, icon, isGemini = false, isLocal = false, isGeminiReview = false}) => {
    let enabledClasses = "bg-brand-accent hover:bg-brand-accent-hover";
    if (isGemini) enabledClasses = "bg-brand-gemini hover:opacity-90";
    else if (isLocal) enabledClasses = "bg-brand-info hover:opacity-90";
    else if (isGeminiReview) enabledClasses = "bg-yellow-600 hover:bg-yellow-700";
    
    return (
        <button onClick={onClick} disabled={disabled} className={`w-full text-white font-bold py-2.5 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center space-x-2 shadow-lg disabled:bg-brand-border disabled:cursor-not-allowed ${disabled ? '' : enabledClasses}`} aria-disabled={disabled}>
            {isLoading ? <SpinnerIcon className="h-5 w-5 text-white animate-spin" /> : <>{icon}{<span>{children}</span>}</>}
        </button>
    );
}

const SimulationPlaceholder: React.FC<{ title: string; message: string; }> = ({ title, message }) => (
    <div className="text-center p-8 bg-brand-bg/50 rounded-lg border-2 border-dashed border-brand-border">
        <h3 className="text-lg font-bold text-brand-warn mb-2">{title}</h3>
        <p className="text-brand-text-secondary">{message}</p>
    </div>
);

const GitStep: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="p-4 border border-brand-border rounded-lg bg-brand-bg/30 space-y-3">
        <h2 className="text-lg font-semibold text-brand-text-primary flex items-center">{icon}<span>{title}</span></h2>
        <div className="space-y-2">{children}</div>
    </div>
);

const StepCard: React.FC<{ step: number, title: string, children: React.ReactNode }> = ({ step, title, children }) => (
  <div className="p-4 border border-brand-border rounded-lg bg-brand-bg/30">
    <div className="flex items-center mb-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-accent text-white font-bold mr-3 flex-shrink-0">{step}</div>
      <h3 className="text-xl font-semibold text-brand-text-primary">{title}</h3>
    </div>
    <div className="pl-11 space-y-3">{children}</div>
  </div>
);

const CodeSnippet: React.FC<{ commands: string[]; }> = ({ commands }) => {
    const [copied, setCopied] = useState(false);
    const textToCopy = commands.filter(cmd => !cmd.startsWith('#')).join('\n');
    const handleCopy = () => { navigator.clipboard.writeText(textToCopy); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return (
        <div className="bg-brand-bg p-3 rounded-md relative font-mono text-sm text-brand-text-secondary border border-brand-border mt-3">
            <button onClick={handleCopy} className="absolute top-2 right-2 text-xs bg-brand-border px-2 py-1 rounded hover:bg-brand-accent transition-colors" aria-label="Copy terminal commands">
                {copied ? 'Copied!' : 'Copy'}
            </button>
            <pre><code className="whitespace-pre-wrap">
                {commands.map((cmd, i) => (
                    <span key={i} className="block">
                        {cmd.startsWith('#') 
                            ? <span className="text-gray-500 italic">{cmd}</span> 
                            : <><span className="text-brand-accent mr-1" aria-hidden="true">$</span>{cmd}</>
                        }
                    </span>
                ))}
            </code></pre>
        </div>
    )
};

export default ControlPanel;
