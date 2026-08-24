import { Router } from "express";
import { StaffRequestController } from "../controllers/StaffRequestController";
import { JwtMiddleware } from "../middleware/JwtMiddleware";

export class StaffRequestRouter {
  constructor(
    private router: Router,
    private staffRequestController: StaffRequestController,
  ) {
    this.addRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  private addRoutes() {
    this.router.post(
      "/me/leave-requests",
      JwtMiddleware.verifyToken,
      this.staffRequestController.createLeaveRequest,
    );

    this.router.patch(
      "/me/leave-requests/:requestId/cancel",
      JwtMiddleware.verifyToken,
      this.staffRequestController.cancelLeaveRequest,
    );

    this.router.get(
      "/me/leave-requests",
      JwtMiddleware.verifyToken,
      this.staffRequestController.getMyLeaveRequests,
    );

    this.router.get(
      "/me/leave-balance",
      JwtMiddleware.verifyToken,
      this.staffRequestController.getMyLeaveBalance,
    );
  }
}
