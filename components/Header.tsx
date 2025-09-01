
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-brand-surface border-b border-brand-border p-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-center space-x-3">
        <SparklesIcon className="w-8 h-8 text-brand-accent" />
        <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary tracking-wider">
          AI / AGI / AIM Unified Tool
        </h1>
      </div>
    </header>
  );
};

export default Header;
