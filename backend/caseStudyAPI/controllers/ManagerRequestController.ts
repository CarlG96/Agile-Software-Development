import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  LeaveBalanceRepositoryFactory,
  LeaveRequestRepositoryFactory,
  LeaveRequestStatusRepositoryFactory,
  UserRepositoryFactory,
} from "../src/factories/Factories";

interface JwtAuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
    managerId?: number;
  };
}

export class ManagerRequestController {
  private userRepositoryFactory: UserRepositoryFactory;
  private leaveRequestRepositoryFactory: LeaveRequestRepositoryFactory;
  private leaveRequestStatusRepositoryFactory: LeaveRequestStatusRepositoryFactory;
  private leaveBalanceRepositoryFactory: LeaveBalanceRepositoryFactory;

  constructor(
    userRepositoryFactory: UserRepositoryFactory,
    leaveBalanceRepositoryFactory: LeaveBalanceRepositoryFactory,
    leaveRequestRepositoryFactory: LeaveRequestRepositoryFactory,
    leaveRequestStatusRepositoryFactory: LeaveRequestStatusRepositoryFactory,
  ) {
    this.userRepositoryFactory = userRepositoryFactory;
    this.leaveBalanceRepositoryFactory = leaveBalanceRepositoryFactory;
    this.leaveRequestRepositoryFactory = leaveRequestRepositoryFactory;
    this.leaveRequestStatusRepositoryFactory =
      leaveRequestStatusRepositoryFactory;
  }

  // GET /manager/leave-requests/outstanding
  // Returns pending requests for staff assigned to this manager.
  public getOutstandingTeamRequests = async (
    req: JwtAuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const leaveRequestRepo =
        this.leaveRequestRepositoryFactory.createLeaveRequestRepository();
      const statusRepo =
        this.leaveRequestStatusRepositoryFactory.createLeaveRequestStatusRepository();
      const userRepo = this.userRepositoryFactory.createUserRepository();

      const managerId = req.user?.userId;

      if (!managerId) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "User not authenticated" });
        return;
      }

      const manager = await userRepo.findById(managerId);
      if (!manager) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "Manager not found" });
        return;
      }

      const pendingStatus = await statusRepo.findByStatus("Pending");
      if (!pendingStatus) {
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ error: "Pending status not found" });
        return;
      }

      const leaveRequests =
        await leaveRequestRepo.findByUserAndManager(managerId);

      // Filter by pending status
      const pendingRequests = leaveRequests.filter(
        (req) => req.status.id === pendingStatus.id,
      );

      const pendingRequestsWithoutUser = pendingRequests.map(
        ({ user, ...leaveRequestWithoutUser }) => ({
          ...leaveRequestWithoutUser,
          user: {
            firstName: user?.firstName,
            lastName: user?.lastName,
          },
        }),
      );

      res.status(StatusCodes.OK).json(pendingRequestsWithoutUser);
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  };

  // PATCH /manager/leave-requests/:requestId/approve
  // Approves a team member leave request.
  public approveLeaveRequest = async (
    req: JwtAuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const leaveRequestRepo =
        this.leaveRequestRepositoryFactory.createLeaveRequestRepository();
      const userRepo = this.userRepositoryFactory.createUserRepository();
      const { requestId } = req.params;
      const managerId = req.user?.userId;

      if (!managerId) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "User not authenticated" });
        return;
      }

      const manager = await userRepo.findById(managerId);
      if (!manager) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "Manager not found" });
        return;
      }

      const leaveRequest = await leaveRequestRepo.findById(
        parseInt(requestId as string),
        ["user", "user.manager", "leaveType", "status"],
      );

      if (
        !leaveRequest ||
        !leaveRequest.user ||
        leaveRequest.user.manager?.id !== manager.id
      ) {
        res.status(StatusCodes.NOT_FOUND).json({
          error: "Leave request not found or not under your management",
        });
        return;
      }

      await leaveRequest.approve();
      await leaveRequestRepo.save(leaveRequest);

      res.status(StatusCodes.OK).json({
        message: "Approved leave request",
        id: leaveRequest.id,
      });
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  };

  // PATCH /manager/leave-requests/:requestId/reject
  // Rejects a team member leave request.
  public rejectLeaveRequest = async (
    req: JwtAuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const leaveRequestRepo =
        this.leaveRequestRepositoryFactory.createLeaveRequestRepository();
      const userRepo = this.userRepositoryFactory.createUserRepository();
      const { requestId } = req.params;
      const managerId = req.user?.userId;

      if (!managerId) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "User not authenticated" });
        return;
      }

      const manager = await userRepo.findById(managerId);
      if (!manager) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "Manager not found" });
        return;
      }

      const leaveRequest = await leaveRequestRepo.findById(
        parseInt(requestId as string),
        ["user", "user.manager", "leaveType", "status"],
      );

      if (
        !leaveRequest ||
        !leaveRequest.user ||
        leaveRequest.user.manager?.id !== manager.id
      ) {
        res.status(StatusCodes.NOT_FOUND).json({
          error: "Leave request not found or not under your management",
        });
        return;
      }

      await leaveRequest.reject();
      await leaveRequestRepo.save(leaveRequest);

      res.status(StatusCodes.OK).json({
        message: "Rejected leave request",
        id: leaveRequest.id,
      });
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  };

  // GET /manager/staff/:staffId/leave-balance
  // Returns remaining annual leave for a member of staff.
  public getStaffLeaveBalance = async (
    req: JwtAuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const balanceRepo =
        this.leaveBalanceRepositoryFactory.createLeaveBalanceRepository();
      const userRepo = this.userRepositoryFactory.createUserRepository();
      const { staffId } = req.params;
      const managerId = req.user?.userId;

      if (!managerId) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "User not authenticated" });
        return;
      }

      const manager = await userRepo.findById(managerId);
      if (!manager) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "Manager not found" });
        return;
      }

      const staff = await userRepo.findByIdWithRelations(
        parseInt(staffId as string),
        ["manager"],
      );

      if (!staff || staff.manager?.id !== manager.id) {
        res.status(StatusCodes.NOT_FOUND).json({
          error: "Staff member not found or not under your management",
        });
        return;
      }

      const balances = await balanceRepo.findByUser(staff);

      res.status(StatusCodes.OK).json(balances);
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  };
}
