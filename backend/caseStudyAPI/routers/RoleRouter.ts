import { Router } from "express";
import { RoleController } from "../controllers/RoleController";
import { JwtMiddleware } from "../middleware/JwtMiddleware";
import { RoleMiddleware } from "../middleware/RoleMiddleware";

export class RoleRouter {
  constructor(
    private router: Router,
    private roleController: RoleController,
  ) {
    this.addRoutes();
  }
  public getRouter(): Router {
    return this.router;
  }
  private addRoutes() {
    this.router.get(
      "/",
      JwtMiddleware.verifyToken,
      RoleMiddleware.requireRole("admin"),
      this.roleController.getAllRoles,
    );
    this.router.get(
      "/:id",
      JwtMiddleware.verifyToken,
      RoleMiddleware.requireRole("admin"),
      this.roleController.getRoleById,
    );
  }
}
