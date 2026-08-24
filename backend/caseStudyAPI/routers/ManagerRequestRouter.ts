import { Router } from "express";
import { ManagerRequestController } from "../controllers/ManagerRequestController";
import { JwtMiddleware } from "../middleware/JwtMiddleware";
import { RoleMiddleware } from "../middleware/RoleMiddleware";

export class ManagerRequestRouter {
  constructor(
    private router: Router,
    private managerRequestController: ManagerRequestController,
  ) {
    this.addRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  private addRoutes() {
    this.router.get(
      "/leave-requests/outstanding",
      JwtMiddleware.verifyToken,
      RoleMiddleware.requireRole("manager"),
      this.managerRequestController.getOutstandingTeamRequests,
    );

    this.router.patch(
      "/leave-requests/:requestId/approve",
      JwtMiddleware.verifyToken,
      RoleMiddleware.requireRole("manager"),
      this.managerRequestController.approveLeaveRequest,
    );

    this.router.patch(
      "/leave-requests/:requestId/reject",
      JwtMiddleware.verifyToken,
      RoleMiddleware.requireRole("manager"),
      this.managerRequestController.rejectLeaveRequest,
    );

    this.router.get(
      "/staff/:staffId/leave-balance",
      JwtMiddleware.verifyToken,
      RoleMiddleware.requireRole("manager"),
      this.managerRequestController.getStaffLeaveBalance,
    );
  }
}
