import React, { useState, useRef, useEffect } from 'react';
import { TerminalIcon } from './icons/TerminalIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CodeIcon } from './icons/CodeIcon';

interface DownloadButtonProps {
    content: string;
    fileName: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ content, fileName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const exportFormats = [
        { format: 'sh', icon: <TerminalIcon className="w-4 h-4 text-brand-accent" />, mimeType: 'application/x-shellscript' },
        { format: 'txt', icon: <DocumentTextIcon className="w-4 h-4 text-brand-text-secondary" />, mimeType: 'text/plain' },
        { format: 'md', icon: <SparklesIcon className="w-4 h-4 text-brand-info" />, mimeType: 'text/markdown' },
        { format: 'json', icon: <CodeIcon className="w-4 h-4 text-brand-warn" />, mimeType: 'application/json' },
    ];

    const handleDownload = (format: string, mimeType: string) => {
        const lastDotIndex = fileName.lastIndexOf('.');
        const baseName = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
        const newFileName = `${baseName}.${format}`;
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = newFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-sm bg-brand-border px-3 py-1 rounded hover:bg-brand-success transition-colors flex items-center"
            >
                Download
                <svg className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-brand-surface border border-brand-border rounded-md shadow-lg z-10">
                    <ul className="py-1">
                        {exportFormats.map(({ format, icon, mimeType }) => (
                            <li key={format}>
                                <button
                                    onClick={() => handleDownload(format, mimeType)}
                                    className="w-full text-left px-3 py-2 text-sm text-brand-text-primary hover:bg-brand-bg flex items-center space-x-2"
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
    );
};

export default DownloadButton;
