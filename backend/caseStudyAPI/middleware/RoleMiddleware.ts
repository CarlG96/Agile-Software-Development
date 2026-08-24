import { Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtAuthRequest } from "./JwtMiddleware";

export class RoleMiddleware {
  public static requireRole(...allowedRoles: string[]) {
    return (req: JwtAuthRequest, res: Response, next: NextFunction): void => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        res.status(StatusCodes.FORBIDDEN).send("Forbidden");
        return;
      }
      next();
    };
  }
}
