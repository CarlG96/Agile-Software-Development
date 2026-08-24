import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

export class AuthRouter {
  constructor(
    private router: Router,
    private authController: AuthController,
  ) {
    this.addRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  private addRoutes() {
    this.router.post("/login", this.authController.login);
  }
}
