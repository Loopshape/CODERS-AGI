
export enum LogType {
  Info = 'Info',
  Success = 'Success',
  Warn = 'Warn',
  Error = 'Error',
  AI = 'AI',
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
  history: string[];
  historyIndex: number;
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

export interface ApiRequest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    body?: string;
}

export interface ApiHistoryEntry extends ApiRequest {
    id: string;
    timestamp: string;
}

export interface SavedApiRequest {
    name: string;
    request: ApiRequest;
}


export interface ApiResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
}