// middleware/responseLogger.ts
import { Request, Response, NextFunction } from "express";
import { ILogger } from "../logging/ILogger";

export function responseLogger(logger: ILogger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    function maybeLog(body: unknown) {
      // ✅ Only log non-success responses
      if (res.statusCode < 400) return;

      const durationMs = Date.now() - start;

      const safeBody = { ...req.body };
      if ("password" in safeBody) safeBody.password = "[REDACTED]";

      logger
        .error({
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          durationMs,
          response: body,
          requestBody: safeBody,
          params: req.params,
          query: req.query,
        })
        .catch(() => {});
    }

    res.json = (body: any) => {
      maybeLog(body);
      return originalJson(body);
    };

    res.send = (body: any) => {
      maybeLog(body);
      return originalSend(body);
    };

    next();
  };
}
