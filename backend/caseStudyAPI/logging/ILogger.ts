export interface ILogger {
  error(error: any): Promise<void>;
}

interface Error {
  message: string;
}
