import { AppDataSource } from "../data-source";
import { LeaveBalance } from "../entity/LeaveBalance";
import { User } from "../entity/User";
import { LeaveType } from "../entity/LeaveType";

export class LeaveBalanceRepository {
  private get repository() {
    return AppDataSource.getRepository(LeaveBalance);
  }

  async findByUser(user: User): Promise<LeaveBalance[]> {
    return this.repository.find({
      where: { user: { id: user.id } },
      relations: ["leaveType"],
    });
  }

  async findByUserAndLeaveType(
    user: User,
    leaveType: LeaveType,
  ): Promise<LeaveBalance | null> {
    return this.repository.findOne({
      where: {
        user: { id: user.id },
        leaveType: { id: leaveType.id },
      },
      relations: ["user", "leaveType"],
    });
  }

  async findByUserIdAndLeaveTypeId(
    userId: number,
    leaveTypeId: number,
  ): Promise<LeaveBalance | null> {
    return this.repository.findOne({
      where: {
        user: { id: userId },
        leaveType: { id: leaveTypeId },
      },
      relations: ["user", "leaveType"],
    });
  }

  async save(balance: LeaveBalance): Promise<LeaveBalance> {
    return this.repository.save(balance);
  }

  async saveMultiple(balances: LeaveBalance[]): Promise<LeaveBalance[]> {
    return this.repository.save(balances);
  }

  create(data: Partial<LeaveBalance>): LeaveBalance {
    return this.repository.create(data);
  }

  async findAll(): Promise<LeaveBalance[]> {
    return this.repository.find({
      relations: ["user", "leaveType"],
    });
  }
}
