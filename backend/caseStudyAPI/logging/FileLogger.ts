import { appendFile } from "fs/promises";
import { ILogger } from "./ILogger";

export class FileLogger implements ILogger {
  constructor(private readonly filePath: string = "error.log") {}

  async error(error: any): Promise<void> {
    const message =
      error instanceof Error
        ? (error.stack ?? error.message)
        : typeof error === "string"
          ? error
          : JSON.stringify(error, null, 2); // ✅ THIS

    const log = `
${new Date().toISOString()}
${message}
`;

    await appendFile(this.filePath, log, { encoding: "utf-8" });
  }
}
