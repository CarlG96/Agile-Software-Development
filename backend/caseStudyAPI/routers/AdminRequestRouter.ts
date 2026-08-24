import { Router } from "express";
import { AdminRequestController } from "../controllers/AdminRequestController";
import { JwtMiddleware } from "../middleware/JwtMiddleware";
import { RoleMiddleware } from "../middleware/RoleMiddleware";

export class AdminRequestRouter {
  constructor(
    private router: Router,
    private adminRequestController: AdminRequestController,
  ) {
    this.addRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  private addRoutes() {
    this.router.post(
      "/staff",
      JwtMiddleware.verifyToken,
      RoleMiddleware.requireRole("admin"),
      this.adminRequestController.addStaffMember,
    );

    this.router.patch(
      "/staff/:staffId/profile",
      JwtMiddleware.verifyToken,
      RoleMiddleware.requireRole("admin"),
      this.adminRequestController.amendStaffProfile,
    );

    this.router.get(
      "/leave-requests/outstanding",
      JwtMiddleware.verifyToken,
      RoleMiddleware.requireRole("admin"),
      this.adminRequestController.getOutstandingRequests,
    );

    this.router.patch(
      "/staff/:staffId/leave-allocation",
      JwtMiddleware.verifyToken,
      RoleMiddleware.requireRole("admin"),
      this.adminRequestController.amendLeaveAllocation,
    );

    this.router.patch(
      "/leave-requests/:requestId/approve",
      JwtMiddleware.verifyToken,
      RoleMiddleware.requireRole("admin"),
      this.adminRequestController.approveOnBehalfOfManager,
    );

    this.router.get(
      "/analytics/leave-usage",
      JwtMiddleware.verifyToken,
      RoleMiddleware.requireRole("admin"),
      this.adminRequestController.getSystemLeaveUsage,
    );
  }
}
