import React, { useState, useRef, useEffect } from 'react';
import { TerminalIcon } from './icons/TerminalIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { SparklesIcon } from './SparklesIcon';
import { CodeIcon } from './icons/CodeIcon';

interface DownloadButtonProps {
    content: string;
    fileName: string;
}

interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    fileName: string;
    onFileNameChange: (newName: string) => void;
    format: string;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, onSave, fileName, onFileNameChange, format }) => {
    if (!isOpen) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSave();
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="download-modal-title">
            <div className="bg-brand-surface border border-brand-border rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-brand-border">
                    <h3 id="download-modal-title" className="text-lg font-bold">Save File As...</h3>
                    <button onClick={onClose} className="text-2xl text-brand-text-secondary hover:text-brand-text-primary" aria-label="Close dialog">&times;</button>
                </header>
                <main className="p-6 space-y-4">
                    <div>
                        <label htmlFor="filename-input" className="block text-sm font-medium text-brand-text-secondary mb-2">
                            File name (as .{format})
                        </label>
                        <input
                            id="filename-input"
                            type="text"
                            value={fileName}
                            onChange={(e) => onFileNameChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-brand-bg border border-brand-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            autoFocus
                        />
                    </div>
                </main>
                <footer className="flex justify-end p-4 bg-brand-bg/50 rounded-b-lg space-x-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-brand-border text-brand-text-primary hover:bg-brand-border/80 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onSave} className="px-4 py-2 rounded-md bg-brand-success text-white font-bold hover:bg-green-500 transition-colors">
                        Save
                    </button>
                </footer>
            </div>
        </div>
    );
};

const DownloadButton: React.FC<DownloadButtonProps> = ({ content, fileName }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [downloadInfo, setDownloadInfo] = useState({ format: '', mimeType: '', finalFileName: '' });
    const dropdownRef = useRef<HTMLDivElement>(null);

    const exportFormats = [
        { format: 'sh', icon: <TerminalIcon className="w-4 h-4 text-brand-accent" />, mimeType: 'application/x-shellscript' },
        { format: 'txt', icon: <DocumentTextIcon className="w-4 h-4 text-brand-text-secondary" />, mimeType: 'text/plain' },
        { format: 'md', icon: <SparklesIcon className="w-4 h-4 text-brand-info" />, mimeType: 'text/markdown' },
        { format: 'json', icon: <CodeIcon className="w-4 h-4 text-brand-warn" />, mimeType: 'application/json' },
    ];

    const handleFormatSelect = (format: string, mimeType: string) => {
        const lastDotIndex = fileName.lastIndexOf('.');
        const baseName = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
        
        let newFileName = `${baseName}.${format}`;
        // Special case for shell scripts to download without an extension if they are named 'ai' or 'ai-installer'
        if (format === 'sh' && (baseName === 'ai' || baseName === 'ai-installer')) {
            newFileName = baseName;
        }
        
        setDownloadInfo({ format, mimeType, finalFileName: newFileName });
        setIsDropdownOpen(false);
        setIsModalOpen(true);
    };

    const handleConfirmDownload = () => {
        if (!downloadInfo.finalFileName.trim()) {
            return;
        }

        const blob = new Blob([content], { type: downloadInfo.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadInfo.finalFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsModalOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="text-sm bg-brand-border/50 px-3 py-1 rounded hover:bg-brand-success hover:text-white transition-colors flex items-center"
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                >
                    Download
                    <svg className={`w-4 h-4 ml-1 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-36 bg-brand-surface border border-brand-border rounded-md shadow-lg z-10 animate-fade-in">
                        <ul className="py-1" role="menu">
                            {exportFormats.map(({ format, icon, mimeType }) => (
                                <li key={format}>
                                    <button
                                        onClick={() => handleFormatSelect(format, mimeType)}
                                        className="w-full text-left px-3 py-2 text-sm text-brand-text-primary hover:bg-brand-bg flex items-center space-x-2"
                                        role="menuitem"
                                    >
                                        {icon}
                                        <span>as .{format}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <DownloadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleConfirmDownload}
                fileName={downloadInfo.finalFileName}
                onFileNameChange={(newName) => setDownloadInfo(d => ({ ...d, finalFileName: newName }))}
                format={downloadInfo.format}
            />
        </>
    );
};

export default DownloadButton;
