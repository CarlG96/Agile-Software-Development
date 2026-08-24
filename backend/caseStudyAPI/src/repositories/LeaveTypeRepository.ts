import { AppDataSource } from "../data-source";
import { LeaveType } from "../entity/LeaveType";

export class LeaveTypeRepository {
  private get repository() {
    return AppDataSource.getRepository(LeaveType);
  }

  async findById(id: number): Promise<LeaveType | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByName(typeName: string): Promise<LeaveType | null> {
    return this.repository.findOne({ where: { typeName } });
  }

  async findAll(): Promise<LeaveType[]> {
    return this.repository.find();
  }

  async save(leaveType: LeaveType): Promise<LeaveType> {
    return this.repository.save(leaveType);
  }

  async saveMultiple(leaveTypes: LeaveType[]): Promise<LeaveType[]> {
    return this.repository.save(leaveTypes);
  }

  create(data: Partial<LeaveType>): LeaveType {
    return this.repository.create(data);
  }

  async findOrCreate(
    typeName: string,
  ): Promise<{ leaveType: LeaveType; isNew: boolean }> {
    let leaveType = await this.findByName(typeName);
    if (!leaveType) {
      leaveType = this.create({ typeName });
      leaveType = await this.save(leaveType);
      return { leaveType, isNew: true };
    }
    return { leaveType, isNew: false };
  }
}
