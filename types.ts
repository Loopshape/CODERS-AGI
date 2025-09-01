
export enum LogType {
  Info = 'Info',
  Success = 'Success',
  Warn = 'Warn',
  Error = 'Error',
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
