import { AppDataSource } from "../data-source";
import { LeaveRequestStatus } from "../entity/LeaveRequestStatus";

export class LeaveRequestStatusRepository {
  private get repository() {
    return AppDataSource.getRepository(LeaveRequestStatus);
  }

  async findByStatus(status: string): Promise<LeaveRequestStatus | null> {
    return this.repository.findOne({ where: { status } });
  }

  async findAll(): Promise<LeaveRequestStatus[]> {
    return this.repository.find();
  }

  async findById(id: number): Promise<LeaveRequestStatus | null> {
    return this.repository.findOne({ where: { id } });
  }
}
