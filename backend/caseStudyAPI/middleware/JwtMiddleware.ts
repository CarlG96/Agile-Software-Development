import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

export interface JwtAuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
    managerId?: number;
  };
}

export class JwtMiddleware {
  public static verifyToken(
    req: JwtAuthRequest,
    res: Response,
    next: NextFunction,
  ): void {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;

    if (!token) {
      res.status(StatusCodes.UNAUTHORIZED).send("Missing token");
      return;
    }

    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "default-secret",
      ) as any;
      req.user = {
        userId: payload.userId,
        role: payload.role,
        managerId: payload.managerId,
      };
      next();
    } catch (error) {
      res.status(StatusCodes.UNAUTHORIZED).send("Invalid token");
    }
  }
}
