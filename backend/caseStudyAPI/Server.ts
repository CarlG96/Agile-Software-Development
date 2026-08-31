import express, { Request, Response } from "express";
import { DataSource } from "typeorm";
import { AdminRequestRouter } from "./routers/AdminRequestRouter";
import { AuthRouter } from "./routers/AuthRouter";
import { ManagerRequestRouter } from "./routers/ManagerRequestRouter";
import { RoleRouter } from "./routers/RoleRouter";
import { StaffRequestRouter } from "./routers/StaffRequestRouter";
import { StatusCodes } from "http-status-codes";
import rateLimit from "express-rate-limit";
import { responseLogger } from "./middleware/LoggingMiddleware";
import { FileLogger } from "./logging/FileLogger";

export class Server {
  private readonly app: express.Application;
  constructor(
    private readonly port: string | number,
    private readonly adminRequestRouter: AdminRequestRouter,
    private readonly authRouter: AuthRouter,
    private readonly managerRequestRouter: ManagerRequestRouter,
    private readonly roleRouter: RoleRouter,
    private readonly staffRequestRouter: StaffRequestRouter,
    private readonly appDataSource: DataSource,
  ) {
    this.app = express();
    this.initialiseMiddlewares();
    this.initialiseRoutes();
    this.initialiseObfuscation();
    this.initialiseErrorHandling();
  }
  private initialiseObfuscation() {
    this.app.disable("x-powered-by");
    this.app.use((req, res, next) => {
      res.setHeader("Server", "Unknown");
      next();
    });
  }
  private initialiseMiddlewares() {
    this.app.use(express.json());
    this.app.use(responseLogger(new FileLogger()));
  }
  private initialiseRoutes() {
    const rateLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: "Too many requests from this endpoint, please try again later.",
    });
    this.app.use(
      "/api/admin",
      rateLimiter,
      this.adminRequestRouter.getRouter(),
    );
    this.app.use("/api/auth", rateLimiter, this.authRouter.getRouter());
    this.app.use(
      "/api/manager",
      rateLimiter,
      this.managerRequestRouter.getRouter(),
    );
    this.app.use("/api/role", rateLimiter, this.roleRouter.getRouter());
    this.app.use(
      "/api/staff",
      rateLimiter,
      this.staffRequestRouter.getRouter(),
    );
  }
  private initialiseErrorHandling() {
    this.app.use((req: Request, res: Response) => {
      const requestedUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
      res
        .status(StatusCodes.NOT_FOUND)
        .send("Route " + requestedUrl + " not found");
    });
  }
  public async start() {
    await this.initialiseDataSource();
    this.app.listen(this.port, () => {
      console.log(`Server running on http://localhost:${this.port}`);
    });
  }
  private async initialiseDataSource() {
    try {
      await this.appDataSource.initialize();
      console.log("Data Source initialised");
    } catch (error) {
      console.log("Error during initialisation:", error);
      throw error;
    }
  }
}
