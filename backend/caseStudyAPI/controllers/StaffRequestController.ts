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
      const parsedLeaveTypeId = Number(leaveTypeId);
      const requestStartDate = parseDate(startDate);
      const requestEndDate = parseDate(endDate);

      if (!Number.isInteger(parsedLeaveTypeId) || !requestStartDate || !requestEndDate) {
        res.status(StatusCodes.BAD_REQUEST).json({
          error: "A valid leave type, start date, and end date are required",
        });
        return;
      }

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (requestStartDate < today) {
        res.status(StatusCodes.BAD_REQUEST).json({
          error: "Leave requests cannot start before today",
        });
        return;
      }

      if (requestEndDate < requestStartDate) {
        res.status(StatusCodes.BAD_REQUEST).json({
          error: "The end date cannot be before the start date",
        });
        return;
      }

      const leaveType = await leaveTypeRepo.findById(parsedLeaveTypeId);
      if (!leaveType) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "Invalid leave type" });
        return;
      }

      const daysRequested =
        Math.round(
          (requestEndDate.getTime() - requestStartDate.getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1;
      const leaveBalance =
        await this.leaveBalanceRepositoryFactory
          .createLeaveBalanceRepository()
          .findByUserAndLeaveType(user, leaveType);

      if (!leaveBalance || leaveBalance.remaining < daysRequested) {
        res.status(StatusCodes.BAD_REQUEST).json({
          error: `Insufficient ${leaveType.typeName} leave balance for this request`,
        });
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
        startDate: requestStartDate,
        endDate: requestEndDate,
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

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}
