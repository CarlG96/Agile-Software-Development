import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  LeaveRequestRepositoryFactory,
  LeaveRequestStatusRepositoryFactory,
  LeaveTypeRepositoryFactory,
  LeaveBalanceRepositoryFactory,
  UserRepositoryFactory,
} from "../src/factories/Factories";

interface JwtAuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
    managerId?: number;
  };
}

export class StaffRequestController {
  private userRepositoryFactory: UserRepositoryFactory;
  private leaveRequestRepositoryFactory: LeaveRequestRepositoryFactory;
  private leaveRequestStatusRepositoryFactory: LeaveRequestStatusRepositoryFactory;
  private leaveTypeRepositoryFactory: LeaveTypeRepositoryFactory;
  private leaveBalanceRepositoryFactory: LeaveBalanceRepositoryFactory;

  constructor(
    userRepositoryFactory: UserRepositoryFactory,
    leaveRequestRepositoryFactory: LeaveRequestRepositoryFactory,
    leaveRequestStatusRepositoryFactory: LeaveRequestStatusRepositoryFactory,
    leaveTypeRepositoryFactory: LeaveTypeRepositoryFactory,
    leaveBalanceRepositoryFactory: LeaveBalanceRepositoryFactory,
  ) {
    this.userRepositoryFactory = userRepositoryFactory;
    this.leaveRequestRepositoryFactory = leaveRequestRepositoryFactory;
    this.leaveRequestStatusRepositoryFactory =
      leaveRequestStatusRepositoryFactory;
    this.leaveTypeRepositoryFactory = leaveTypeRepositoryFactory;
    this.leaveBalanceRepositoryFactory = leaveBalanceRepositoryFactory;
  }

  // POST me/leave-requests
  // Creates a new annual leave request with initial Pending status.
  public createLeaveRequest = async (
    req: JwtAuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const leaveRequestRepo =
        this.leaveRequestRepositoryFactory.createLeaveRequestRepository();
      const statusRepo =
        this.leaveRequestStatusRepositoryFactory.createLeaveRequestStatusRepository();
      const leaveTypeRepo =
        this.leaveTypeRepositoryFactory.createLeaveTypeRepository();
      const userRepo = this.userRepositoryFactory.createUserRepository();
      const { leaveTypeId, startDate, endDate } = req.body;
      const userId = req.user?.userId;
      if (!userId) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "User not authenticated" });
        return;
      }
      const user = await userRepo.findById(userId);
      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ error: "User not found" });
        return;
      }
      const leaveType = await leaveTypeRepo.findById(leaveTypeId);
      if (!leaveType) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "Invalid leave type" });
        return;
      }
      const pendingStatus = await statusRepo.findByStatus("Pending");
      if (!pendingStatus) {
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ error: "Pending status not found" });
        return;
      }
      const leaveRequest = leaveRequestRepo.create({
        user,
        leaveType,
        status: pendingStatus,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      await leaveRequestRepo.save(leaveRequest);

      const { user: _user, ...leaveRequestWithoutUser } = leaveRequest;

      res.status(StatusCodes.CREATED).json({
        message: "Leave request created",
        leaveRequest: leaveRequestWithoutUser,
      });
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  };

  // PATCH /staff/me/leave-requests/:requestId/cancel
  // Allows staff to cancel an existing leave request.
  public cancelLeaveRequest = async (
    req: JwtAuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const leaveRequestRepo =
        this.leaveRequestRepositoryFactory.createLeaveRequestRepository();
      const userRepo = this.userRepositoryFactory.createUserRepository();

      const { requestId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "User not authenticated" });
        return;
      }

      const user = await userRepo.findById(userId);
      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ error: "User not found" });
        return;
      }

      const leaveRequest = await leaveRequestRepo.findByUserAndId(
        userId,
        parseInt(requestId as string),
      );

      if (!leaveRequest) {
        res
          .status(StatusCodes.NOT_FOUND)
          .json({ error: "Leave request not found" });
        return;
      }

      await leaveRequest.cancel();
      await leaveRequestRepo.save(leaveRequest);

      const { user: _user, ...leaveRequestWithoutUser } = leaveRequest;

      res.status(StatusCodes.CREATED).json({
        message: "Leave request cancelled",
        leaveRequest: leaveRequestWithoutUser,
      });
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  };

  // GET /staff/me/leave-requests
  // Returns all requests with their statuses.
  public getMyLeaveRequests = async (
    req: JwtAuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const leaveRequestRepo =
        this.leaveRequestRepositoryFactory.createLeaveRequestRepository();
      const userRepo = this.userRepositoryFactory.createUserRepository();

      const userId = req.user?.userId;

      if (!userId) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "User not authenticated" });
        return;
      }

      const user = await userRepo.findById(userId);
      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ error: "User not found" });
        return;
      }

      const leaveRequests = await leaveRequestRepo.findByUser(userId);

      res.status(StatusCodes.OK).json(leaveRequests);
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  };

  // GET /staff/me/leave-balance
  // Returns remaining/used leave for the current business year.
  public getMyLeaveBalance = async (
    req: JwtAuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const leaveBalanceRepo =
        this.leaveBalanceRepositoryFactory.createLeaveBalanceRepository();
      const userRepo = this.userRepositoryFactory.createUserRepository();

      const userId = req.user?.userId;

      if (!userId) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "User not authenticated" });
        return;
      }

      const user = await userRepo.findById(userId);
      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ error: "User not found" });
        return;
      }

      const balances = await leaveBalanceRepo.findByUser(user);

      res.status(StatusCodes.OK).json(balances);
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  };
}
