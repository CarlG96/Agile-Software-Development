import { AppDataSource } from "../data-source";
import { LeaveRequest } from "../entity/LeaveRequest";
import { LeaveRequestStatus } from "../entity/LeaveRequestStatus";
import { User } from "../entity/User";

export class LeaveRequestRepository {
  private get repository() {
    return AppDataSource.getRepository(LeaveRequest);
  }

  async findById(
    id: number,
    relations: string[] = ["user", "leaveType", "status"],
  ): Promise<LeaveRequest | null> {
    return this.repository.findOne({
      where: { id },
      relations,
    });
  }

  async findByUserAndId(
    userId: number,
    requestId: number,
  ): Promise<LeaveRequest | null> {
    return this.repository.findOne({
      where: {
        id: requestId,
        user: { id: userId },
      },
      relations: ["user", "leaveType", "status"],
    });
  }

  async findByUser(userId: number): Promise<LeaveRequest[]> {
    return this.repository.find({
      where: { user: { id: userId } },
      relations: ["leaveType", "status"],
    });
  }

  async findByUserAndManager(managerId: number): Promise<LeaveRequest[]> {
    return this.repository.find({
      where: { user: { manager: { id: managerId } } },
      relations: ["user", "leaveType", "status"],
    });
  }

  async findByStatus(status: LeaveRequestStatus): Promise<LeaveRequest[]> {
    return this.repository.find({
      where: { status: { id: status.id } },
      relations: ["user", "leaveType", "status"],
    });
  }

  async findOutstandingWithFilters(
    pendingStatus: LeaveRequestStatus,
    staffId?: number,
    managerId?: number,
  ): Promise<LeaveRequest[]> {
    const query = this.repository
      .createQueryBuilder("leaveRequest")
      .leftJoin("leaveRequest.user", "user")
      .leftJoin("user.manager", "manager")
      .leftJoinAndSelect("leaveRequest.leaveType", "leaveType")
      .leftJoinAndSelect("leaveRequest.status", "status")
      .select([
        "leaveRequest",
        "leaveType",
        "status",
        "user.id",
        "user.firstName",
        "user.lastName",
        "manager.id",
        "manager.firstName",
        "manager.lastName",
      ])
      .where("status.id = :pendingStatusId", {
        pendingStatusId: pendingStatus.id,
      });

    if (staffId !== undefined) {
      query.andWhere("user.id = :staffId", { staffId });
    }

    if (managerId !== undefined) {
      query.andWhere("manager.id = :managerId", { managerId });
    }

    return query.getMany();
  }

  async save(leaveRequest: LeaveRequest): Promise<LeaveRequest> {
    return this.repository.save(leaveRequest);
  }

  create(data: Partial<LeaveRequest>): LeaveRequest {
    return this.repository.create(data);
  }

  async findAll(): Promise<LeaveRequest[]> {
    return this.repository.find({
      relations: ["user", "leaveType", "status"],
    });
  }
}
