import { AppDataSource } from "../data-source";
import { Role } from "../entity/Role";

export class RoleRepository {
  private get repository() {
    return AppDataSource.getRepository(Role);
  }

  async findById(id: number): Promise<Role | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<Role[]> {
    return this.repository.find();
  }
}
