
export enum LogType {
  Info = 'Info',
  Success = 'Success',
  Warn = 'Warn',
  Error = 'Error',
  AI = 'AI',
  // Fix: Add Gemini to LogType enum to resolve usage errors.
  Gemini = 'Gemini',
}

export interface LogEntry {
  type: LogType;
  message: string;
  timestamp: string;
}

export interface ProcessedFile {
  fileName: string;
  content: string;
}

// Fix: Add missing type definitions for CodeReviewReport and CodeIssue.
export interface CodeIssue {
  line?: number;
  description: string;
  suggestion: string;
}

export interface CodeReviewReport {
  reviewSummary: string;
  potentialBugs: CodeIssue[];
  securityVulnerabilities: CodeIssue[];
  performanceImprovements: CodeIssue[];
}

// Fix: Add missing types for Chatbot component to resolve import errors.
export enum MessageSender {
  User = 'User',
  AI = 'AI',
  Error = 'Error',
}

export interface ChatMessage {
  sender: MessageSender;
  text: string;
  timestamp: string;
}