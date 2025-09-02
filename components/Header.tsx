
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

const PanelIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);


interface HeaderProps {
  onTogglePanel: () => void;
  isPanelOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onTogglePanel, isPanelOpen }) => {
  return (
    <header role="banner" className="bg-brand-surface/80 backdrop-blur-sm border-b border-brand-border p-3 shadow-lg sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between space-x-4">
        <button 
          onClick={onTogglePanel} 
          className="p-2 rounded-md hover:bg-brand-border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent"
          aria-label={isPanelOpen ? "Collapse control panel" : "Expand control panel"}
        >
          <PanelIcon className={`w-6 h-6 transition-colors ${isPanelOpen ? 'text-brand-accent' : 'text-brand-text-secondary'}`} />
        </button>

        <div className="flex items-center space-x-4">
          <SparklesIcon className="w-8 h-8 text-brand-accent" aria-hidden="true" />
          <div className="text-center">
              <h1 className="text-xl md:text-2xl font-bold text-brand-text-primary tracking-wider">
                AI / AGI / AIM Unified Tool
              </h1>
              <p className="text-xs text-brand-text-secondary hidden sm:block">Advanced file processing & AI-powered enhancements</p>
          </div>
        </div>

        <div className="w-10"></div>{/* Spacer to balance the toggle button */}
      </div>
    </header>
  );
};

export default Header;
