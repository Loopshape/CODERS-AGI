
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageSender } from '../types';
import { ChatIcon } from './icons/ChatIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CpuChipIcon } from './icons/CpuChipIcon';

interface ChatbotProps {
    isOpen: boolean;
    toggleChat: () => void;
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, toggleChat, messages, onSendMessage, isLoading }) => {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim() || isLoading) return;
        onSendMessage(inputValue);
        setInputValue('');
    };

    return (
        <>
            <button
                onClick={toggleChat}
                className="fixed bottom-6 right-6 bg-brand-info text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-500 transition-transform transform hover:scale-110 focus:outline-none z-50"
                aria-label="Toggle Chatbot"
            >
                <ChatIcon className="w-8 h-8" />
            </button>
            
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[90vw] max-w-md h-[70vh] max-h-[600px] bg-brand-surface border border-brand-border rounded-lg shadow-2xl flex flex-col z-50 animate-fade-in-up">
                    <header className="flex items-center justify-between p-4 border-b border-brand-border">
                        <div className="flex items-center space-x-2">
                            <CpuChipIcon className="w-6 h-6 text-brand-info" />
                            <h2 className="font-bold text-brand-text-primary">Local AI Assistant</h2>
                        </div>
                        <button onClick={toggleChat} className="text-brand-text-secondary hover:text-brand-text-primary text-2xl leading-none">&times;</button>
                    </header>
                    
                    <div className="flex-grow p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2 ${msg.sender === MessageSender.User ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender !== MessageSender.User && <div className={`w-8 h-8 rounded-full ${msg.sender === MessageSender.Error ? 'bg-brand-error' : 'bg-brand-info'} flex items-center justify-center shrink-0`}><CpuChipIcon className="w-5 h-5 text-white" /></div>}
                                <div className={`max-w-xs md:max-w-sm rounded-lg px-4 py-2 ${
                                    msg.sender === MessageSender.User ? 'bg-brand-accent text-white rounded-br-none' : 
                                    msg.sender === MessageSender.Error ? 'bg-brand-error/20 text-brand-error border border-brand-error rounded-bl-none' : 
                                    'bg-brand-bg text-brand-text-primary rounded-bl-none'
                                }`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-end gap-2 justify-start">
                                <div className="w-8 h-8 rounded-full bg-brand-info flex items-center justify-center shrink-0"><CpuChipIcon className="w-5 h-5 text-white" /></div>
                                <div className="max-w-xs md:max-w-sm rounded-lg px-4 py-2 bg-brand-bg text-brand-text-primary rounded-bl-none">
                                    <SpinnerIcon className="w-5 h-5 text-brand-info animate-spin"/>
                                </div>
                            </div>
                        )}
                         <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-brand-border">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ask the local AI..."
                                className="flex-grow bg-brand-bg border border-brand-border rounded-lg p-2 focus:outline-none"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || !inputValue.trim()}
                                className="bg-brand-info text-white px-4 py-2 rounded-lg font-semibold disabled:bg-brand-border disabled:cursor-not-allowed"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chatbot;