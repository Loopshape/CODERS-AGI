import React, { useState, useRef } from 'react';
import ProgressBar from './ProgressBar';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { BASHRC_ADAPTATION_CODE } from '../services/scriptService';

interface ControlPanelProps {
  onProcessFiles: (files: File[]) => void;
  onScanEnvironment: () => void;
  onProcessPrompt: (prompt: string) => void;
  onProcessUrl: (url: string) => void;
  onUrlEnhance: (url: string) => void;
  onGeminiEnhance: (file: File) => void;
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
  const [activeTab, setActiveTab] = useState<'installer' | 'ai' | 'agi' | 'prompt' | 'git'>('ai');
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Git state
  const [filesToAdd, setFilesToAdd] = useState('.');
  const [commitMessage, setCommitMessage] = useState('');
  const [remoteName, setRemoteName] = useState('origin');
  const [branchName, setBranchName] = useState('main');
  const [activeGitAction, setActiveGitAction] = useState<string | null>(null);

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

  const triggerGitFeedback = (action: string, callback: () => void) => {
    setActiveGitAction(action);
    callback();
    setTimeout(() => setActiveGitAction(null), 700);
  };

  const handleGitInitClick = () => {
    triggerGitFeedback('init', onGitInit);
  };

  const handleGitAddClick = () => {
    if (filesToAdd.trim()) {
      triggerGitFeedback('add', () => onGitAdd(filesToAdd));
    }
  };

  const handleGitCommitClick = () => {
    if (commitMessage.trim()) {
      triggerGitFeedback('commit', () => onGitCommit(commitMessage));
    }
  };

  const handleGitPushClick = () => {
    if (remoteName.trim() && branchName.trim()) {
      triggerGitFeedback('push', () => onGitPush(remoteName, branchName));
    }
  };


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

  return (
    <div className="bg-brand-surface rounded-lg border border-brand-border shadow-2xl p-6 sticky top-8">
      <div className="flex border-b border-brand-border mb-6">
        <TabButton isActive={activeTab === 'ai'} onClick={() => setActiveTab('ai')}>AI Modes</TabButton>
        <TabButton isActive={activeTab === 'agi'} onClick={() => setActiveTab('agi')}>AGI Modes</TabButton>
        <TabButton isActive={activeTab === 'git'} onClick={() => setActiveTab('git')}>Git</TabButton>
        <TabButton isActive={activeTab === 'prompt'} onClick={() => setActiveTab('prompt')}>Direct Prompt</TabButton>
        <TabButton isActive={activeTab === 'installer'} onClick={() => setActiveTab('installer')}>Installer</TabButton>
      </div>

      <div className="min-h-[380px]">
        {activeTab === 'installer' && (
            <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-brand-accent">Termux Proot-Distro Installer</h2>
                    <p className="text-brand-text-secondary mt-1">Install the fully-automated `ai` command-line tool.</p>
                </div>
                
                <div className="p-4 border border-brand-border rounded-lg space-y-3 bg-brand-bg/30">
                    <h3 className="text-xl font-semibold text-brand-text-primary">Step 1: Get the Installer Script</h3>
                    <p className="text-sm text-brand-text-secondary">This generates the main `ai` script. After downloading, make it executable using the command shown below.</p>
                    <ActionButton onClick={onGetInstallerScript} disabled={isLoading} isLoading={loadingAction === 'getInstallerScript'}>
                        Generate `ai` Installer Script
                    </ActionButton>
                    <CodeSnippet commands={[
                        '# After downloading, move `ai` to your home directory or ~/bin',
                        'chmod +x ai'
                    ]} />
                </div>

                <div className="p-4 border border-brand-border rounded-lg space-y-3 bg-brand-bg/30">
                    <h3 className="text-xl font-semibold text-brand-text-primary">Step 2: Initialize & Configure</h3>
                    <p className="text-sm text-brand-text-secondary">Run the script's `init` command to finalize setup. After initialization, you must restart your shell for the changes to take effect, as shown in the command below.</p>
                    <BashrcCodeDisplay code={BASHRC_ADAPTATION_CODE} />
                    <CodeSnippet commands={[
                        './ai init',
                        '# Restart your shell or run:',
                        'source ~/.bashrc'
                    ]} />
                </div>
            </div>
        )}
        {activeTab === 'ai' && (
          <div className="flex flex-col space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-brand-text-primary">1. Select File(s)</h2>
                <div 
                    onClick={triggerFileSelect}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`mt-3 flex flex-col justify-center items-center w-full min-h-[8rem] p-4 transition-all bg-brand-bg border-2 border-brand-border border-dashed rounded-md appearance-none cursor-pointer hover:border-brand-accent focus:outline-none ${isDragging ? 'border-brand-accent ring-2 ring-brand-accent/50' : ''}`}
                >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
                    {selectedFiles.length > 0 ? (
                        <div className="text-center w-full">
                            <p className="text-brand-success font-medium">{selectedFiles.length} file(s) selected</p>
                            <ul className="text-xs text-brand-text-secondary mt-2 list-disc list-inside max-h-24 overflow-y-auto text-left px-4">
                               {selectedFiles.map(f => {
                                  const isProcessingThisFile = 
                                    loadingAction === 'processFiles' ||
                                    (loadingAction === 'geminiEnhance' && processingFile?.name === f.name) ||
                                    (loadingAction === 'localAIEnhance' && processingFile?.name === f.name);
                                  return (
                                    <li key={f.name} className="flex items-center justify-between text-brand-text-secondary">
                                      <span className="truncate pr-2">{f.name}</span>
                                      {isProcessingThisFile && <SpinnerIcon className="w-4 h-4 text-brand-accent flex-shrink-0 animate-spin" />}
                                    </li>
                                  );
                                })}
                            </ul>
                        </div>
                    ) : (
                         <span className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <span className="font-medium text-brand-text-secondary">
                              {isDragging ? "Drop files here" : <>Drop files or <span className="text-brand-accent">browse</span></>}
                            </span>
                        </span>
                    )}
                </div>
            </div>
            
            <div>
                <h2 className="text-xl font-semibold text-brand-text-primary">2. Choose Action</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <ActionButton onClick={handleProcessFilesClick} disabled={selectedFiles.length === 0 || isLoading} isLoading={loadingAction === 'processFiles'}>
                    Process File(s)
                  </ActionButton>
                  <ActionButton onClick={handleLocalAIEnhanceClick} disabled={selectedFiles.length === 0 || isLoading} isLoading={loadingAction === 'localAIEnhance'} isLocal>
                    Local AI Enhance
                  </ActionButton>
                  <ActionButton onClick={handleGeminiEnhanceClick} disabled={selectedFiles.length === 0 || isLoading} isLoading={loadingAction === 'geminiEnhance'} isGemini>
                    Gemini AI Enhance
                  </ActionButton>
                  <ActionButton onClick={onScanEnvironment} disabled={isLoading} isLoading={loadingAction === 'scanEnvironment'}>
                    Scan Environment
                  </ActionButton>
                </div>
            </div>

            <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-brand-border"></div>
                <span className="flex-shrink mx-4 text-brand-text-secondary uppercase text-sm">Then</span>
                <div className="flex-grow border-t border-brand-border"></div>
            </div>

            <div>
                <h2 className="text-xl font-semibold text-brand-text-primary">3. AI Training</h2>
                <p className="text-sm text-brand-text-secondary mt-1 mb-3">Use the output of "Gemini AI Enhance" to improve the local model.</p>
                <ActionButton onClick={onImproveLocalAI} disabled={!hasEnhancedFile || isLoading} isLoading={loadingAction === 'improveLocalAI'}>
                    Improve Local AI
                </ActionButton>
            </div>
          </div>
        )}
        {activeTab === 'agi' && (
            <div className="space-y-4">
                 <SimulationPlaceholder title="Watch Mode (+/~)" message="This simulates watching a folder for file changes. This functionality requires filesystem access and cannot be implemented in the browser." />
                 <SimulationPlaceholder title="Virtual Screenshot (-)" message="This simulates generating a virtual screenshot of a specified aspect ratio." />
            </div>
        )}
         {activeTab === 'git' && (
          <div className="flex flex-col space-y-4">
            <div className={`p-4 border border-brand-border rounded-lg transition-all duration-300 ${activeGitAction === 'init' ? 'ring-2 ring-brand-accent' : ''}`}>
              <h2 className="text-xl font-semibold text-brand-text-primary mb-3">1. Initialize</h2>
              <ActionButton onClick={handleGitInitClick} disabled={isLoading} isLoading={loadingAction === 'gitInit'}>
                Initialize Git Repository
              </ActionButton>
            </div>
            
            <div className="p-4 border border-brand-border rounded-lg space-y-3">
              <h2 className="text-xl font-semibold text-brand-text-primary">2. Stage</h2>
               <input 
                  type="text"
                  value={filesToAdd}
                  onChange={(e) => setFilesToAdd(e.target.value)}
                  className={`w-full p-2 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition-all duration-300 ${activeGitAction === 'add' ? 'ring-2 ring-brand-accent' : ''}`}
                  placeholder="e.g., '.' or 'src/index.js'"
              />
              <ActionButton onClick={handleGitAddClick} disabled={!filesToAdd.trim() || isLoading} isLoading={loadingAction === 'gitAdd'}>
                Stage Changes (`git add`)
              </ActionButton>
            </div>

            <div className="p-4 border border-brand-border rounded-lg space-y-3">
              <h2 className="text-xl font-semibold text-brand-text-primary">3. Commit</h2>
              <input 
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className={`w-full p-2 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition-all duration-300 ${activeGitAction === 'commit' ? 'ring-2 ring-brand-accent' : ''}`}
                  placeholder="Your commit message"
              />
              <ActionButton onClick={handleGitCommitClick} disabled={!commitMessage.trim() || isLoading} isLoading={loadingAction === 'gitCommit'}>
                Commit (`git commit`)
              </ActionButton>
            </div>

            <div className="p-4 border border-brand-border rounded-lg space-y-3">
              <h2 className="text-xl font-semibold text-brand-text-primary">4. Push</h2>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={remoteName} onChange={(e) => setRemoteName(e.target.value)} className={`w-full p-2 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition-all duration-300 ${activeGitAction === 'push' ? 'ring-2 ring-brand-accent' : ''}`} placeholder="Remote (e.g., origin)" />
                <input type="text" value={branchName} onChange={(e) => setBranchName(e.target.value)} className={`w-full p-2 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition-all duration-300 ${activeGitAction === 'push' ? 'ring-2 ring-brand-accent' : ''}`} placeholder="Branch (e.g., main)" />
              </div>
              <ActionButton onClick={handleGitPushClick} disabled={!remoteName.trim() || !branchName.trim() || isLoading} isLoading={loadingAction === 'gitPush'}>
                Push to Remote (`git push`)
              </ActionButton>
            </div>
          </div>
        )}
        {activeTab === 'prompt' && (
            <div className="flex flex-col space-y-4 p-4 border border-brand-border rounded-lg">
                <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-brand-text-primary">From Text Prompt</h2>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full h-28 p-3 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                        placeholder="Enter prompt text or file content here..."
                    />
                    <ActionButton onClick={handleProcessPromptClick} disabled={!prompt.trim() || isLoading} isLoading={loadingAction === 'processPrompt'}>
                        Process Text Prompt
                    </ActionButton>
                </div>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-brand-border"></div>
                    <span className="flex-shrink mx-4 text-brand-text-secondary uppercase text-sm">Or</span>
                    <div className="flex-grow border-t border-brand-border"></div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-brand-text-primary">From URL</h2>
                    <input 
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full p-3 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                        placeholder="https://example.com"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ActionButton onClick={handleProcessUrlClick} disabled={!url.trim() || isLoading} isLoading={loadingAction === 'processUrl'}>
                            Fetch & Process
                        </ActionButton>
                        <ActionButton onClick={handleUrlEnhanceClick} disabled={!url.trim() || isLoading} isLoading={loadingAction === 'urlEnhance'} isGemini>
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


interface TabButtonProps {
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children }) => {
    const baseClasses = "flex-1 text-center py-3 px-2 font-semibold transition-colors duration-300 focus:outline-none";
    const activeClasses = "text-brand-accent border-b-2 border-brand-accent";
    const inactiveClasses = "text-brand-text-secondary hover:text-brand-text-primary";
    return (
        <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {children}
        </button>
    )
}

interface ActionButtonProps {
    onClick: () => void;
    disabled: boolean;
    isLoading: boolean;
    children: React.ReactNode;
    isGemini?: boolean;
    isLocal?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, disabled, isLoading, children, isGemini = false, isLocal = false}) => {
    const baseClasses = "w-full text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-lg";
    let enabledClasses = "bg-brand-accent hover:bg-brand-accent-hover";
    if (isGemini) {
        enabledClasses = "bg-brand-gemini hover:bg-purple-700";
    } else if (isLocal) {
        enabledClasses = "bg-brand-info hover:bg-sky-500";
    }
    const disabledClasses = "bg-gray-600 cursor-not-allowed";

    return (
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses}`}
        >
            {isLoading ? <SpinnerIcon className="-ml-1 mr-3 h-5 w-5 text-white animate-spin" /> : children}
        </button>
    );
}

interface SimulationPlaceholderProps {
    title: string;
    message: string;
}

const SimulationPlaceholder: React.FC<SimulationPlaceholderProps> = ({ title, message }) => (
    <div className="text-center p-8 bg-brand-bg rounded-lg border-2 border-dashed border-brand-border">
        <h3 className="text-lg font-bold text-brand-warn mb-2">{title}</h3>
        <p className="text-brand-text-secondary">{message}</p>
    </div>
);

interface CodeSnippetProps {
    commands: string[];
}

interface BashrcCodeDisplayProps {
    code: string;
}

const BashrcCodeDisplay: React.FC<BashrcCodeDisplayProps> = ({ code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-brand-bg p-3 rounded-md relative font-mono text-sm text-brand-text-secondary border border-brand-border mt-3">
            <button onClick={handleCopy} className="absolute top-2 right-2 text-xs bg-brand-border px-2 py-1 rounded hover:bg-brand-accent transition-colors">
                {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <pre><code className="whitespace-pre-wrap">{code}</code></pre>
        </div>
    );
};

const CodeSnippet: React.FC<CodeSnippetProps> = ({ commands }) => {
    const [copied, setCopied] = useState(false);
    const textToCopy = commands.filter(cmd => !cmd.startsWith('#')).join('\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-brand-bg p-3 rounded-md relative font-mono text-sm text-brand-text-secondary border border-brand-border mt-3">
            <button onClick={handleCopy} className="absolute top-2 right-2 text-xs bg-brand-border px-2 py-1 rounded hover:bg-brand-accent transition-colors">
                {copied ? 'Copied!' : 'Copy'}
            </button>
            <pre><code className="whitespace-pre-wrap">
                {commands.map((cmd, i) => (
                    <span key={i} className="block">
                        {cmd.startsWith('#') 
                            ? <span className="text-gray-500 italic">{cmd}</span> 
                            : <><span className="text-brand-accent mr-1">$</span>{cmd}</>
                        }
                    </span>
                ))}
            </code></pre>
        </div>
    )
};


export default ControlPanel;
