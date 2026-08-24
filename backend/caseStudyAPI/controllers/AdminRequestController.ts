import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  LeaveBalanceRepositoryFactory,
  LeaveRequestRepositoryFactory,
  LeaveRequestStatusRepositoryFactory,
  LeaveTypeRepositoryFactory,
  RoleRepositoryFactory,
  UserRepositoryFactory,
} from "../src/factories/Factories";

export class AdminRequestController {
  private userRepositoryFactory: UserRepositoryFactory;
  private roleRepositoryFactory: RoleRepositoryFactory;
  private leaveTypeRepositoryFactory: LeaveTypeRepositoryFactory;
  private leaveBalanceRepositoryFactory: LeaveBalanceRepositoryFactory;
  private leaveRequestRepositoryFactory: LeaveRequestRepositoryFactory;
  private leaveRequestStatusRepositoryFactory: LeaveRequestStatusRepositoryFactory;

  constructor(
    userRepositoryFactory: UserRepositoryFactory,
    roleRepositoryFactory: RoleRepositoryFactory,
    leaveTypeRepositoryFactory: LeaveTypeRepositoryFactory,
    leaveBalanceRepositoryFactory: LeaveBalanceRepositoryFactory,
    leaveRequestRepositoryFactory: LeaveRequestRepositoryFactory,
    leaveRequestStatusRepositoryFactory: LeaveRequestStatusRepositoryFactory,
  ) {
    this.userRepositoryFactory = userRepositoryFactory;
    this.roleRepositoryFactory = roleRepositoryFactory;
    this.leaveTypeRepositoryFactory = leaveTypeRepositoryFactory;
    this.leaveBalanceRepositoryFactory = leaveBalanceRepositoryFactory;
    this.leaveRequestRepositoryFactory = leaveRequestRepositoryFactory;
    this.leaveRequestStatusRepositoryFactory =
      leaveRequestStatusRepositoryFactory;
  }

  // POST staff
  // Adds a new staff member and creates default leave balances.
  public addStaffMember = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const { firstName, lastName, email, password, roleId, managerId } =
      req.body;

    if (!firstName || !lastName || !email || !password || !roleId) {
      res.status(StatusCodes.BAD_REQUEST).send("Missing required user fields");
      return;
    }
    const userRepository = this.userRepositoryFactory.createUserRepository();
    const roleRepository = this.roleRepositoryFactory.createRoleRepository();
    const leaveTypeRepository =
      this.leaveTypeRepositoryFactory.createLeaveTypeRepository();
    const leaveBalanceRepository =
      this.leaveBalanceRepositoryFactory.createLeaveBalanceRepository();

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      res
        .status(StatusCodes.CONFLICT)
        .send("A user with that email already exists");
      return;
    }

    const role = await roleRepository.findById(roleId);
    if (!role) {
      res.status(StatusCodes.BAD_REQUEST).send("Invalid roleId");
      return;
    }

    let manager = null;
    if (managerId) {
      manager = await userRepository.findById(managerId);
      if (!manager) {
        res.status(StatusCodes.BAD_REQUEST).send("Manager not found");
        return;
      }
    }

    const { leaveType: annualLeave } =
      await leaveTypeRepository.findOrCreate("Annual Leave");
    const { leaveType: sickLeave } =
      await leaveTypeRepository.findOrCreate("Sick");

    const user = userRepository.create({
      firstName,
      lastName,
      email,
      passwordHash: password,
      role,
      manager: manager || undefined,
    });

    const savedUser = await userRepository.save(user);

    const balances = [
      leaveBalanceRepository.create({
        user: savedUser,
        leaveType: annualLeave,
        remaining: 25,
      }),
      leaveBalanceRepository.create({
        user: savedUser,
        leaveType: sickLeave,
        remaining: 5,
      }),
    ];

    await leaveBalanceRepository.saveMultiple(balances);

    res.status(StatusCodes.CREATED).json({
      message: `Created user ${savedUser.firstName} ${savedUser.lastName}`,
      id: savedUser.id,
    });
  };

  // PATCH staff/:staffId/profile
  // Updates role and/or manager relationship for a staff member.
  public amendStaffProfile = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const staffId = parseInt(req.params.staffId as string, 10);
      const { roleId, managerId } = req.body;
      const userRepository = this.userRepositoryFactory.createUserRepository();
      const roleRepository = this.roleRepositoryFactory.createRoleRepository();

      if (!roleId && managerId === undefined) {
        res.status(StatusCodes.BAD_REQUEST).json({
          error: "At least one of roleId or managerId must be provided",
        });
        return;
      }

      const staff = await userRepository.findByIdWithRelations(staffId, [
        "role",
        "manager",
      ]);
      if (!staff) {
        res
          .status(StatusCodes.NOT_FOUND)
          .json({ error: "Staff member not found" });
        return;
      }

      if (roleId) {
        const role = await roleRepository.findById(roleId);
        if (!role) {
          res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid roleId" });
          return;
        }
        staff.role = role;
      }

      if (managerId !== undefined) {
        if (managerId === null) {
          staff.manager = undefined;
        } else {
          const manager = await userRepository.findById(managerId);
          if (!manager) {
            res
              .status(StatusCodes.BAD_REQUEST)
              .json({ error: "Manager not found" });
            return;
          }
          staff.manager = manager;
        }
      }

      const updatedStaff = await userRepository.save(staff);

      res.status(StatusCodes.OK).json({
        message: `${updatedStaff.firstName} ${updatedStaff.lastName} role amended to ${updatedStaff.role.name}`,
        id: updatedStaff.id,
      });
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  };

  // GET /leave-requests/outstanding
  // Returns outstanding leave requests by filter/scope.
  public getOutstandingRequests = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const staffId = req.query.staffId
        ? parseInt(req.query.staffId as string, 10)
        : undefined;
      const managerId = req.query.managerId
        ? parseInt(req.query.managerId as string, 10)
        : undefined;

      if (req.query.staffId && Number.isNaN(staffId)) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid staffId" });
        return;
      }

      if (req.query.managerId && Number.isNaN(managerId)) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "Invalid managerId" });
        return;
      }

      const leaveRequestStatusRepository =
        this.leaveRequestStatusRepositoryFactory.createLeaveRequestStatusRepository();
      const leaveRequestRepository =
        this.leaveRequestRepositoryFactory.createLeaveRequestRepository();

      const pendingStatus =
        await leaveRequestStatusRepository.findByStatus("Pending");
      if (!pendingStatus) {
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ error: "Pending status not found" });
        return;
      }

      const leaveRequests =
        await leaveRequestRepository.findOutstandingWithFilters(
          pendingStatus,
          staffId,
          managerId,
        );

      res.status(StatusCodes.OK).json(leaveRequests);
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  };

  // PATCH staff/:staffId/annual-leave-allocation
  // Adjusts annual leave entitlement.
  public amendLeaveAllocation = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const staffId = parseInt(req.params.staffId as string, 10);
      const { leaveTypeId, leaveTypeName, remaining } = req.body;

      const userRepository = this.userRepositoryFactory.createUserRepository();
      const leaveTypeRepository =
        this.leaveTypeRepositoryFactory.createLeaveTypeRepository();
      const leaveBalanceRepository =
        this.leaveBalanceRepositoryFactory.createLeaveBalanceRepository();

      if (Number.isNaN(staffId)) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid staffId" });
        return;
      }

      if (
        remaining === undefined ||
        typeof remaining !== "number" ||
        remaining < 0
      ) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "Remaining leave must be a non-negative number" });
        return;
      }

      if (!leaveTypeId && !leaveTypeName) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "leaveTypeId or leaveTypeName is required" });
        return;
      }

      const staff = await userRepository.findById(staffId);
      if (!staff) {
        res
          .status(StatusCodes.NOT_FOUND)
          .json({ error: "Staff member not found" });
        return;
      }

      const leaveType = leaveTypeId
        ? await leaveTypeRepository.findById(leaveTypeId)
        : await leaveTypeRepository.findByName(leaveTypeName);

      if (!leaveType) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "Leave type not found" });
        return;
      }

      let balance = await leaveBalanceRepository.findByUserAndLeaveType(
        staff,
        leaveType,
      );

      if (!balance) {
        balance = leaveBalanceRepository.create({
          user: staff,
          leaveType,
          remaining,
        });
      } else {
        balance.remaining = remaining;
      }

      const updatedBalance = await leaveBalanceRepository.save(balance);

      res.status(StatusCodes.OK).json({
        message: `Amended ${staff.firstName} ${staff.lastName}'s leave`,
        userId: staff.id,
        leaveTypeId: leaveType.id,
        leaveTypeName: leaveType.typeName,
        remaining: updatedBalance.remaining,
      });
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  };

  // PATCH leave-requests/:requestId/approve
  // Approves requests on behalf of managers.
  public approveOnBehalfOfManager = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { requestId } = req.params;
      const leaveRequestRepository =
        this.leaveRequestRepositoryFactory.createLeaveRequestRepository();

      const leaveRequest = await leaveRequestRepository.findById(
        parseInt(requestId as string),
      );

      if (!leaveRequest) {
        res
          .status(StatusCodes.NOT_FOUND)
          .json({ error: "Leave request not found" });
        return;
      }

      await leaveRequest.approve();
      await leaveRequestRepository.save(leaveRequest);

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

  // GET analytics/leave-usage
  // Returns system-wide leave usage tracking data.
  public getSystemLeaveUsage = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const userRepository = this.userRepositoryFactory.createUserRepository();
      const leaveBalanceRepository =
        this.leaveBalanceRepositoryFactory.createLeaveBalanceRepository();
      const leaveRequestRepository =
        this.leaveRequestRepositoryFactory.createLeaveRequestRepository();
      // Get all data and count
      const allUsers = await userRepository.findAll();
      const totalEmployees = allUsers.length;

      // Get all leave requests for analytics
      const allRequests = await leaveRequestRepository.findAll();

      // Leave requests by status - computed from data
      const requestsByStatus = allRequests.reduce((acc, req) => {
        const statusName = req.status.status;
        const existing = acc.find((item: any) => item.status === statusName);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({ status: statusName, count: 1 });
        }
        return acc;
      }, [] as any[]);

      // Total days requested by leave type and status
      const daysByTypeAndStatus = allRequests.reduce((acc, req) => {
        const key = `${req.leaveType.typeName}-${req.status.status}`;
        const daysRequested = req.daysRequested;
        const existing = acc.find(
          (item: any) =>
            item.leaveType === req.leaveType.typeName &&
            item.status === req.status.status,
        );
        if (existing) {
          existing.totalDays += daysRequested;
        } else {
          acc.push({
            leaveType: req.leaveType.typeName,
            status: req.status.status,
            totalDays: daysRequested,
          });
        }
        return acc;
      }, [] as any[]);

      // Average remaining leave by type
      const allBalances = await leaveBalanceRepository.findAll();
      const avgRemainingByType = allBalances
        .reduce((acc, balance) => {
          const existing = acc.find(
            (item: any) => item.leaveType === balance.leaveType.typeName,
          );
          if (existing) {
            existing.total += balance.remaining;
            existing.count += 1;
            existing.avgRemaining = existing.total / existing.count;
          } else {
            acc.push({
              leaveType: balance.leaveType.typeName,
              avgRemaining: balance.remaining,
              total: balance.remaining,
              count: 1,
            });
          }
          return acc;
        }, [] as any[])
        .map((item: any) => ({
          leaveType: item.leaveType,
          avgRemaining: item.avgRemaining,
        }));

      res.status(StatusCodes.OK).json({
        totalEmployees,
        requestsByStatus,
        daysByTypeAndStatus,
        avgRemainingByType,
      });
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  };
}
