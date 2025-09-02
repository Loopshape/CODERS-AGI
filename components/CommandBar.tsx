
import React, { useState } from 'react';
import { TerminalIcon } from './icons/TerminalIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface CommandBarProps {
  onCommand: (command: string) => void;
  isLoading: boolean;
}

const CommandBar: React.FC<CommandBarProps> = ({ onCommand, isLoading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onCommand(inputValue);
    setInputValue('');
  };

  return (
    <div className="bg-brand-surface border border-brand-border rounded-lg p-3 shadow-lg">
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <TerminalIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a command (e.g., 'scan-env') or ask AI... (try 'help')"
          className="flex-grow bg-brand-bg border border-brand-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-accent text-brand-text-primary font-mono text-sm"
          disabled={isLoading}
          aria-label="Command input"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="bg-brand-accent text-white font-bold px-4 py-2 rounded-md hover:bg-brand-accent-hover transition-colors disabled:bg-brand-border disabled:cursor-not-allowed flex items-center justify-center w-28"
        >
          {isLoading ? <SpinnerIcon className="h-5 w-5 text-white animate-spin" /> : 'Execute'}
        </button>
      </form>
    </div>
  );
};

export default CommandBar;
