import React, { useState, useRef } from 'react';
import ProgressBar from './ProgressBar';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ControlPanelProps {
  onProcessFiles: (files: File[]) => void;
  onScanEnvironment: () => void;
  onProcessPrompt: (prompt: string) => void;
  onProcessUrl: (url: string) => void;
  onGeminiEnhance: (file: File) => void;
  onGetBashrc: () => void;
  onGetInstallScript: () => void;
  onDebugScript: () => void;
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
    onGeminiEnhance,
    onGetBashrc,
    onGetInstallScript,
    onDebugScript,
    isLoading,
    loadingAction,
    processingFile,
    progress
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<'ai' | 'agi' | 'prompt'>('ai');
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <TabButton isActive={activeTab === 'prompt'} onClick={() => setActiveTab('prompt')}>Direct Prompt</TabButton>
      </div>

      <div className="min-h-[380px]">
        {activeTab === 'ai' && (
          <div className="flex flex-col space-y-6">
            <h2 className="text-xl font-semibold text-brand-text-primary">1. Select File(s)</h2>
            <div 
                onClick={triggerFileSelect}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`flex flex-col justify-center items-center w-full min-h-[8rem] p-4 transition-all bg-brand-bg border-2 border-brand-border border-dashed rounded-md appearance-none cursor-pointer hover:border-brand-accent focus:outline-none ${isDragging ? 'border-brand-accent ring-2 ring-brand-accent/50' : ''}`}
            >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
                {selectedFiles.length > 0 ? (
                    <div className="text-center w-full">
                        <p className="text-brand-success font-medium">{selectedFiles.length} file(s) selected</p>
                        <ul className="text-xs text-brand-text-secondary mt-2 list-disc list-inside max-h-24 overflow-y-auto text-left px-4">
                           {selectedFiles.map(f => {
                              const isProcessingThisFile = 
                                loadingAction === 'processFiles' ||
                                (loadingAction === 'geminiEnhance' && processingFile?.name === f.name);
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
            <h2 className="text-xl font-semibold text-brand-text-primary">2. Choose Action</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ActionButton onClick={handleProcessFilesClick} disabled={selectedFiles.length === 0 || isLoading} isLoading={isLoading}>
                Process File(s) (`-` `*` `:`)
              </ActionButton>
              <ActionButton onClick={handleGeminiEnhanceClick} disabled={selectedFiles.length === 0 || isLoading} isLoading={isLoading} isGemini>
                Enhance with Gemini AI ✨
              </ActionButton>
              <div className="md:col-span-2">
                <ActionButton onClick={onScanEnvironment} disabled={isLoading} isLoading={isLoading}>
                  Scan Environment (`.`)
                </ActionButton>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'agi' && (
            <div className="space-y-4">
                 <SimulationPlaceholder title="Watch Mode (+/~)" message="This simulates watching a folder for file changes. This functionality requires filesystem access and cannot be implemented in the browser." />
                 <SimulationPlaceholder title="Virtual Screenshot (-)" message="This simulates generating a virtual screenshot of a specified aspect ratio." />
                 <div className="pt-4 border-t border-brand-border">
                    <h2 className="text-xl font-semibold text-brand-text-primary mb-4 text-center">System Integration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ActionButton onClick={onGetBashrc} disabled={isLoading} isLoading={isLoading}>
                            Get .bashrc Info
                        </ActionButton>
                        <ActionButton onClick={onGetInstallScript} disabled={isLoading} isLoading={isLoading}>
                            Get Self-Install Script
                        </ActionButton>
                    </div>
                 </div>
                 <div className="pt-4 border-t border-brand-border">
                    <h2 className="text-xl font-semibold text-brand-text-primary mb-4 text-center">Diagnostics</h2>
                     <div className="grid grid-cols-1 gap-4">
                         <ActionButton onClick={onDebugScript} disabled={isLoading} isLoading={isLoading}>
                           Debug Script (`--debug`)
                         </ActionButton>
                     </div>
                 </div>
            </div>
        )}
        {activeTab === 'prompt' && (
            <div className="flex flex-col space-y-4">
                <div>
                    <h2 className="text-xl font-semibold text-brand-text-primary mb-3">Enter Prompt Text</h2>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full h-28 p-3 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                        placeholder="Enter prompt text or file content here..."
                    />
                    <ActionButton onClick={handleProcessPromptClick} disabled={!prompt.trim() || isLoading} isLoading={isLoading}>
                        Process Text Prompt
                    </ActionButton>
                </div>

                <div className="flex items-center text-center">
                    <div className="flex-grow border-t border-brand-border"></div>
                    <span className="flex-shrink mx-4 text-brand-text-secondary">OR</span>
                    <div className="flex-grow border-t border-brand-border"></div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-brand-text-primary mb-3">Fetch Prompt from URL</h2>
                    <input 
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full p-3 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition mb-4"
                        placeholder="https://example.com"
                    />
                    <ActionButton onClick={handleProcessUrlClick} disabled={!url.trim() || isLoading} isLoading={isLoading}>
                        Fetch & Process URL
                    </ActionButton>
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
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, disabled, isLoading, children, isGemini = false}) => {
    const baseClasses = "w-full text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-lg";
    const enabledClasses = isGemini 
        ? "bg-brand-gemini hover:bg-purple-700"
        : "bg-brand-accent hover:bg-brand-accent-hover";
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


export default ControlPanel;
