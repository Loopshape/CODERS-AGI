
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

const Header: React.FC = () => {
  return (
    <header role="banner" className="bg-gradient-to-r from-brand-surface to-brand-bg border-b border-brand-border p-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-center space-x-4">
        <SparklesIcon className="w-10 h-10 text-brand-accent animate-pulse" aria-hidden="true" />
        <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary tracking-wider">
              AI / AGI / AIM Unified Tool
            </h1>
            <p className="text-sm text-brand-text-secondary hidden sm:block">A GUI for advanced file processing and AI-powered enhancements.</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
