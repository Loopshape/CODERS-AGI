import React, { useState, useRef, useEffect } from 'react';
import ProgressBar from './ProgressBar';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CpuChipIcon } from './icons/CpuChipIcon';
import { FileCodeIcon } from './icons/FileCodeIcon';
import { GitBranchIcon } from './icons/GitBranchIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { CogIcon } from './icons/CogIcon';
import { ApiRequest, ApiHistoryEntry, SavedApiRequest } from '../types';
import { getConfig, getGitStatus } from '../services/scriptService';
import { SaveIcon } from './icons/SaveIcon';
import { TrashIcon } from './icons/TrashIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { TerminalIcon } from './icons/TerminalIcon';

const ProcessIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>);
const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>);
const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>);
const CloneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375v-3.375a1.125 1.125 0 00-1.125-1.125h-1.5a1.125 1.125 0 00-1.125 1.125v3.375" /></svg>
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
  onApiRequest: (request: ApiRequest) => void;
  onSaveConfig: (fileName: string, content: string) => void;
  apiHistory: ApiHistoryEntry[];
  savedApiRequests: SavedApiRequest[];
  onSaveApiRequest: (name: string, request: ApiRequest) => void;
  onDeleteSavedRequest: (name: string) => void;
  onClearApiHistory: () => void;
  onTrainFromHistory: () => void;
  onTrainFromSavedRequests: () => void;
  onCreateNewFile: () => void;
  isLoading: boolean;
  loadingAction: string | null;
  processingFile: File | null;
  progress: number;
}

const getLoadingMessage = (action: string | null, file: File | null, selectedFiles: File[]): string => {
    switch (action) {
        case 'processFiles': return `Processing ${selectedFiles.length} file(s)...`;
        case 'localAIEnhance': return `Applying local enhancements to ${file?.name}...`;
        case 'ollamaEnhance': return `Enhancing ${file?.name} with Ollama...`;
        case 'aiEnhance':
        case 'aiCodeReview':
            return `Analyzing ${file?.name} with Gemini AI...`;
        case 'cloudAcceleration': return `Accelerating ${file?.name} with Cloud AI...`;
        case 'scanEnvironment': return 'Scanning environment...';
        case 'processPrompt': return 'Processing prompt with AI...';
        case 'processUrl': return 'Fetching and processing URL...';
        case 'urlEnhance': return `Enhancing content from URL...`;
        case 'trainFromUrl': return `Training AI from URL...`;
        case 'improveLocalAI': return 'Training AI from enhanced file...';
        case 'trainFromHistory': return 'Training AI from request history...';
        case 'trainFromSaved': return 'Training AI from saved requests...';
        case 'generateExtension': return 'Generating bash extension with Local AI...';
        case 'getInstallerScript': return 'Generating installer...';
        case 'gitPull': return 'Pulling from repository...';
        case 'gitPush': return 'Pushing to repository...';
        case 'gitClone': return 'Cloning from repository...';
        case 'geminiCommand': return 'Executing AI command...';
        case 'apiRequest': return 'Sending API request...';
        default: return 'Processing...';
    }
};

type PanelTab = 'files' | 'git' | 'api' | 'system';

const ControlPanel: React.FC<ControlPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('files');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  
  const loadingMessage = getLoadingMessage(props.loadingAction, props.processingFile, selectedFiles);

  return (
    <div className="bg-brand-surface rounded-lg border border-brand-border shadow-2xl flex flex-col h-full">
      <div className="flex border-b border-brand-border shrink-0 px-2">
        <TabButton icon={<FileCodeIcon />} label="Files" isActive={activeTab === 'files'} onClick={() => setActiveTab('files')} />
        <TabButton icon={<GitBranchIcon />} label="Git" isActive={activeTab === 'git'} onClick={() => setActiveTab('git')} />
        <TabButton icon={<GlobeIcon />} label="API" isActive={activeTab === 'api'} onClick={() => setActiveTab('api')} />
        <TabButton icon={<CogIcon />} label="System" isActive={activeTab === 'system'} onClick={() => setActiveTab('system')} />
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-grow">
        {activeTab === 'files' && <FilesPanel {...props} selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} prompt={prompt} setPrompt={setPrompt} url={url} setUrl={setUrl} />}
        {activeTab === 'git' && <GitPanel {...props} />}
        {activeTab === 'api' && <ApiPanel {...props} />}
        {activeTab === 'system' && <SystemPanel {...props} />}
      </div>

      <div className="p-4 border-t border-brand-border/50 mt-auto shrink-0 h-24">
        {props.isLoading && (
            <div className="animate-fade-in text-center space-y-2">
                <p className="text-sm text-brand-text-secondary truncate px-2">{loadingMessage}</p>
                <ProgressBar progress={props.progress} />
                {(props.loadingAction === 'ollamaEnhance' || props.loadingAction === 'localAIEnhance') && (
                  <div className="pt-2">
                    <button onClick={props.onCloudAccelerate} className="text-sm text-brand-gemini font-semibold hover:text-brand-accent transition-colors duration-200 animate-pulse">
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

const TabButton: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center justify-center space-x-2 flex-1 text-center py-2.5 px-2 font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-accent/50 border-b-2 ${isActive ? 'text-brand-accent border-brand-accent' : 'text-brand-text-secondary hover:text-brand-text-primary border-transparent'}`} role="tab" aria-selected={isActive}>
        {icon}
        <span className="hidden sm:inline text-sm">{label}</span>
    </button>
);

const FilesPanel: React.FC<ControlPanelProps & {selectedFiles: File[], setSelectedFiles: (f: File[])=>void, prompt: string, setPrompt: (s:string)=>void, url: string, setUrl: (s:string)=>void}> = ({ onProcessFiles, onProcessPrompt, onProcessUrl, onUrlEnhance, onTrainFromUrl, onLocalAIEnhance, onOllamaEnhance, onAiEnhance, onAiCodeReview, onCreateNewFile, isLoading, loadingAction, selectedFiles, setSelectedFiles, prompt, setPrompt, url, setUrl }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasFileSelected = selectedFiles.length > 0;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) setSelectedFiles(Array.from(event.target.files));
    };
    const triggerFileSelect = () => fileInputRef.current?.click();
    const handleProcessFilesClick = () => { if (selectedFiles.length > 0) onProcessFiles(selectedFiles); };
    const handleProcessInput = () => {
        if (url.trim()) onProcessUrl(url.trim());
        else if (prompt.trim()) onProcessPrompt(prompt.trim());
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) setSelectedFiles(Array.from(files));
    };
    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-2">
            <CollapsibleSection title="Direct Input" icon={<TerminalIcon className="w-5 h-5"/>}>
                <div className="pt-2">
                    <textarea value={prompt} onChange={(e) => { setPrompt(e.target.value); setUrl(''); }} className="w-full h-24 p-3 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="Enter prompt text..." aria-label="Text prompt for AI processing"/>
                    <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-brand-border"></div><span className="flex-shrink mx-4 text-brand-text-secondary uppercase text-xs">Or</span><div className="flex-grow border-t border-brand-border"></div></div>
                    <input type="url" value={url} onChange={(e) => { setUrl(e.target.value); setPrompt(''); }} className="w-full p-3 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition" placeholder="https://example.com" aria-label="URL for fetching and processing"/>
                    <div className="mt-3 space-y-2">
                        <ActionButton onClick={handleProcessInput} disabled={(!prompt.trim() && !url.trim()) || isLoading} isLoading={loadingAction === 'processPrompt' || loadingAction === 'processUrl'}>Process Input</ActionButton>
                        <div className="grid grid-cols-2 gap-2">
                            <ActionButton onClick={() => onUrlEnhance(url)} disabled={!url.trim() || isLoading} isLoading={loadingAction === 'urlEnhance'} icon={<SparklesIcon className="w-5 h-5"/>}>Enhance URL</ActionButton>
                            <ActionButton onClick={() => onTrainFromUrl(url)} disabled={!url.trim() || isLoading} isLoading={loadingAction === 'trainFromUrl'} icon={<SparklesIcon className="w-5 h-5"/>}>Train AI</ActionButton>
                        </div>
                    </div>
                </div>
            </CollapsibleSection>
            
            <CollapsibleSection title="File Management" icon={<UploadIcon className="w-5 h-5"/>}>
                <div className="pt-2">
                    <div onClick={triggerFileSelect} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} className={`flex flex-col justify-center items-center w-full p-4 transition-all bg-brand-bg/50 border-2 border-brand-border border-dashed rounded-lg cursor-pointer hover:border-brand-accent focus:outline-none ${isDragging ? 'border-brand-accent ring-2 ring-brand-accent/50 bg-brand-accent/10' : ''}`} role="button" tabIndex={0} aria-label="File selection area">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" aria-hidden="true" />
                        {selectedFiles.length === 0 ? <div className="text-center"><UploadIcon className="w-8 h-8 mx-auto text-brand-text-secondary mb-2"/><p className="font-medium text-brand-text-secondary text-sm">{isDragging ? "Drop files here" : <>Drop files or <span className="text-brand-accent">browse</span></>}</p></div> : <ul className="text-sm text-brand-text-secondary space-y-1 max-h-24 w-full overflow-y-auto">{selectedFiles.map(f => <li key={f.name} className="truncate pr-2">{f.name} ({formatBytes(f.size)})</li>)}</ul>}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <ActionButton onClick={onCreateNewFile} disabled={isLoading} isLoading={false}>New File</ActionButton>
                        <ActionButton onClick={handleProcessFilesClick} disabled={selectedFiles.length === 0 || isLoading} isLoading={loadingAction === 'processFiles'} icon={<ProcessIcon className="w-5 h-5"/>}>Batch Process</ActionButton>
                    </div>
                </div>
            </CollapsibleSection>
            
            <CollapsibleSection title="AI Actions on File" icon={<SparklesIcon className="w-5 h-5"/>}>
                <div className="pt-2">
                    {!hasFileSelected && (
                        <p className="text-xs text-brand-text-secondary text-center py-2">Select a file from the 'File Management' section above to enable AI actions.</p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                        <ActionButton onClick={() => onLocalAIEnhance(selectedFiles[0])} disabled={!hasFileSelected || isLoading} isLoading={loadingAction === 'localAIEnhance'}>Local Enhance</ActionButton>
                        <ActionButton onClick={() => onOllamaEnhance(selectedFiles[0])} disabled={!hasFileSelected || isLoading} isLoading={loadingAction === 'ollamaEnhance'}>Ollama Enhance</ActionButton>
                        <ActionButton onClick={() => onAiEnhance(selectedFiles[0])} disabled={!hasFileSelected || isLoading} isLoading={loadingAction === 'aiEnhance'}>AI Enhance</ActionButton>
                        <ActionButton onClick={() => onAiCodeReview(selectedFiles[0])} disabled={!hasFileSelected || isLoading} isLoading={loadingAction === 'aiCodeReview'} fullWidth>AI Review</ActionButton>
                    </div>
                </div>
            </CollapsibleSection>
        </div>
    );
};

const GitPanel: React.FC<ControlPanelProps> = ({ onGitClone, onGitPull, onGitPush, isLoading, loadingAction }) => {
    const [repoUrl, setRepoUrl] = useState('git@github.com:Loopshape/CODERS-AGI.git');
    const status = getGitStatus();
    return (
        <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-brand-text-secondary">Repository URL:</label>
              <input type="text" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="git@github.com:user/repo.git" className="w-full text-sm p-2 bg-brand-bg border border-brand-border rounded-md"/>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <ActionButton onClick={() => onGitClone(repoUrl)} disabled={!repoUrl.trim() || isLoading} isLoading={loadingAction === 'gitClone'} icon={<CloneIcon className="w-5 h-5"/>}>Clone</ActionButton>
                <ActionButton onClick={() => onGitPull(repoUrl)} disabled={!repoUrl.trim() || isLoading} isLoading={loadingAction === 'gitPull'} icon={<DownloadIcon className="w-5 h-5"/>}>Pull</ActionButton>
                <ActionButton onClick={() => onGitPush(repoUrl)} disabled={!repoUrl.trim() || isLoading} isLoading={loadingAction === 'gitPush'} icon={<UploadIcon className="w-5 h-5"/>}>Push</ActionButton>
            </div>
            <div className="border-t border-brand-border pt-4 mt-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-brand-text-secondary">Current Branch:</span>
                    <span className="font-mono text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded">{status.branch}</span>
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-brand-text-secondary">Last Commit:</span>
                    <span className="font-mono text-brand-text-primary truncate">{status.lastCommit}</span>
                </div>
            </div>
        </div>
    );
};

const ApiPanel: React.FC<ControlPanelProps> = ({ onApiRequest, apiHistory, savedApiRequests, onSaveApiRequest, onDeleteSavedRequest, onClearApiHistory, isLoading, loadingAction }) => {
    const [request, setRequest] = useState<ApiRequest>({ method: 'GET', url: 'https://api.example.com/data', body: '' });

    const handleSend = () => {
        if (request.url.trim()) {
            onApiRequest(request);
        }
    };
    
    const handleSave = () => {
        const name = prompt("Enter a name for this request:", "My API Request");
        if (name && name.trim()) {
            onSaveApiRequest(name, request);
        }
    };

    return (
        <div className="space-y-4">
            {/* Request Form */}
            <div className="p-3 border border-brand-border rounded-lg bg-brand-bg/30 space-y-3">
                <div>
                    <label className="text-sm font-semibold text-brand-text-secondary">Endpoint URL:</label>
                    <div className="flex items-center space-x-2">
                        <select value={request.method} onChange={e => setRequest(r => ({...r, method: e.target.value as ApiRequest['method']}))} className="bg-brand-bg border border-brand-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-accent">
                            <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option>
                        </select>
                        <input type="url" value={request.url} onChange={e => setRequest(r => ({...r, url: e.target.value}))} placeholder="https://api.example.com" className="w-full text-sm p-2 bg-brand-bg border border-brand-border rounded-md"/>
                    </div>
                </div>
                <div>
                    <label className="text-sm font-semibold text-brand-text-secondary">Request Body (JSON):</label>
                    <textarea value={request.body} onChange={e => setRequest(r => ({...r, body: e.target.value}))} disabled={request.method === 'GET'} className="w-full h-24 p-3 font-mono text-sm bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition disabled:opacity-50" placeholder='{ "key": "value" }'/>
                </div>
                <div className="flex items-center space-x-2">
                    <ActionButton onClick={handleSend} disabled={!request.url.trim() || isLoading} isLoading={loadingAction === 'apiRequest'}>Send Request</ActionButton>
                    <button onClick={handleSave} disabled={!request.url.trim() || isLoading} className="p-2 bg-brand-info rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50" aria-label="Save Request"><SaveIcon className="w-5 h-5 text-white"/></button>
                </div>
            </div>

            {/* Saved Requests */}
            <CollapsibleSection title="Saved Requests" icon={<BookmarkIcon className="w-5 h-5"/>}>
                {savedApiRequests.length > 0 ? (
                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {savedApiRequests.map(saved => (
                            <li key={saved.name} className="flex items-center justify-between text-sm p-1.5 rounded hover:bg-brand-bg/50">
                                <button onClick={() => setRequest(saved.request)} className="flex-grow text-left truncate">
                                    <span className="font-semibold text-brand-text-primary">{saved.name}</span>
                                    <span className="text-brand-text-secondary ml-2 truncate">{saved.request.method} {saved.request.url}</span>
                                </button>
                                <button onClick={() => onDeleteSavedRequest(saved.name)} className="p-1 text-brand-text-secondary hover:text-brand-error ml-2"><TrashIcon className="w-4 h-4"/></button>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-xs text-brand-text-secondary text-center py-2">No saved requests yet.</p>}
            </CollapsibleSection>

            {/* History */}
            <CollapsibleSection title="History" icon={<HistoryIcon className="w-5 h-5"/>} actionButton={
                apiHistory.length > 0 && <button onClick={onClearApiHistory} className="text-xs text-brand-text-secondary hover:text-brand-accent">Clear</button>
            }>
                {apiHistory.length > 0 ? (
                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {apiHistory.map(entry => (
                            <li key={entry.id}>
                                <button onClick={() => setRequest({ method: entry.method, url: entry.url, body: entry.body })} className="w-full text-left text-sm p-1.5 rounded hover:bg-brand-bg/50 truncate">
                                    <span className={`font-mono font-semibold ${entry.method === 'GET' ? 'text-green-400' : 'text-yellow-400'}`}>{entry.method}</span>
                                    <span className="text-brand-text-secondary ml-2 truncate">{entry.url}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-xs text-brand-text-secondary text-center py-2">Request history is empty.</p>}
            </CollapsibleSection>
        </div>
    );
};

const SystemPanel: React.FC<ControlPanelProps> = ({ onScanEnvironment, onGetInstallerScript, onGenerateExtension, onImproveLocalAI, onSaveConfig, hasEnhancedFile, onTrainFromHistory, onTrainFromSavedRequests, savedApiRequests, apiHistory, isLoading, loadingAction }) => {
    const configFiles = ['.bashrc', '.env', '.gitconfig', 'settings.json'];
    const [selectedConfig, setSelectedConfig] = useState(configFiles[0]);
    const [configContent, setConfigContent] = useState('');
    const [isConfigLoading, setIsConfigLoading] = useState(false);

    useEffect(() => {
        setIsConfigLoading(true);
        getConfig(selectedConfig).then(content => {
            setConfigContent(content);
            setIsConfigLoading(false);
        });
    }, [selectedConfig]);

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-brand-text-secondary mb-2">System Actions</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <ActionButton onClick={onScanEnvironment} disabled={isLoading} isLoading={loadingAction === 'scanEnvironment'}>Scan Environment</ActionButton>
                    <ActionButton onClick={onGetInstallerScript} disabled={isLoading} isLoading={loadingAction === 'getInstallerScript'}>Get Installer</ActionButton>
                    <ActionButton onClick={onGenerateExtension} disabled={isLoading} isLoading={loadingAction === 'generateExtension'} icon={<CpuChipIcon className="w-5 h-5"/>} fullWidth>Generate Extension</ActionButton>
                </div>

                <h3 className="text-sm font-semibold text-brand-text-secondary mb-2">AI Training</h3>
                <TrainingDropdown
                    onTrainFromFile={onImproveLocalAI}
                    onTrainFromHistory={onTrainFromHistory}
                    onTrainFromSaved={onTrainFromSavedRequests}
                    hasEnhancedFile={hasEnhancedFile}
                    hasHistory={apiHistory.length > 0}
                    hasSavedRequests={savedApiRequests.length > 0}
                    isLoading={isLoading}
                />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-brand-text-secondary mb-2">Dotfile &amp; Config Editor</h3>
                <select value={selectedConfig} onChange={e => setSelectedConfig(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-md p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-brand-accent">
                    {configFiles.map(file => <option key={file} value={file}>{file}</option>)}
                </select>
                <textarea value={configContent} onChange={e => setConfigContent(e.target.value)} className="w-full h-40 p-3 font-mono text-sm bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition" disabled={isConfigLoading} />
                <ActionButton onClick={() => onSaveConfig(selectedConfig, configContent)} disabled={isConfigLoading || isLoading} isLoading={false}>Save {selectedConfig}</ActionButton>
            </div>
        </div>
    );
};

const CollapsibleSection: React.FC<{title: string, icon: React.ReactNode, actionButton?: React.ReactNode, children: React.ReactNode}> = ({ title, icon, actionButton, children }) => {
    return (
        <details className="border border-brand-border/50 rounded-lg overflow-hidden group" open>
            <summary className="w-full flex justify-between items-center p-2 bg-brand-bg/50 hover:bg-brand-bg text-sm font-semibold text-brand-text-secondary hover:text-brand-text-primary cursor-pointer list-none">
                <div className="flex items-center space-x-2">
                    {icon}
                    <span>{title}</span>
                </div>
                <div className="flex items-center space-x-2">
                    {actionButton}
                    <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </div>
            </summary>
            <div className="p-3 border-t border-brand-border/50 animate-fade-in">{children}</div>
        </details>
    )
}

interface ActionButtonProps { onClick: () => void; disabled: boolean; isLoading: boolean; children: React.ReactNode; icon?: React.ReactNode; fullWidth?: boolean; }
const ActionButton: React.FC<ActionButtonProps> = ({ onClick, disabled, isLoading, children, icon, fullWidth}) => (
    <button onClick={onClick} disabled={disabled} className={`w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-3 text-sm rounded-lg transition duration-300 ease-in-out flex items-center justify-center space-x-2 shadow-lg disabled:bg-brand-border disabled:cursor-not-allowed ${fullWidth ? 'col-span-2' : ''}`} aria-disabled={disabled}>
        {isLoading ? <SpinnerIcon className="h-5 w-5 text-white animate-spin" /> : <>{icon}{<span>{children}</span>}</>}
    </button>
);

const TrainingDropdown: React.FC<{
    onTrainFromFile: () => void;
    onTrainFromHistory: () => void;
    onTrainFromSaved: () => void;
    hasEnhancedFile: boolean;
    hasHistory: boolean;
    hasSavedRequests: boolean;
    isLoading: boolean;
}> = ({ onTrainFromFile, onTrainFromHistory, onTrainFromSaved, hasEnhancedFile, hasHistory, hasSavedRequests, isLoading }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const canTrain = hasEnhancedFile || hasHistory || hasSavedRequests;
    const trainingSources = [
        { label: 'From Enhanced File', action: onTrainFromFile, disabled: !hasEnhancedFile },
        { label: 'From API History', action: onTrainFromHistory, disabled: !hasHistory },
        { label: 'From Saved Requests', action: onTrainFromSaved, disabled: !hasSavedRequests },
    ];

    return (
        <div ref={dropdownRef} className="relative">
            <ActionButton
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading || !canTrain}
                isLoading={false} // Main progress bar is used
                fullWidth
            >
                <div className="flex items-center justify-center w-full">
                    <CpuChipIcon className="w-5 h-5"/>
                    <span className="mx-2">Train Local AI</span>
                    <svg className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </ActionButton>
            
            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-brand-surface border border-brand-border rounded-md shadow-lg z-20 animate-fade-in">
                    <ul className="py-1" role="menu">
                        {trainingSources.map(({ label, action, disabled }) => (
                             <li key={label}>
                                <button
                                    onClick={() => { if(!disabled) { action(); setIsOpen(false); } }}
                                    disabled={disabled}
                                    className="w-full text-left px-3 py-2 text-sm text-brand-text-primary hover:bg-brand-bg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    role="menuitem"
                                >
                                    <span>{label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


export default ControlPanel;