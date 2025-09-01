
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
