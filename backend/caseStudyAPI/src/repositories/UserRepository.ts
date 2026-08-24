import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

export class UserRepository {
  private get repository() {
    return AppDataSource.getRepository(User);
  }

  async findById(id: number): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdWithRelations(
    id: number,
    relations: string[] = ["role", "manager"],
  ): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      relations,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findByEmailWithRelations(
    email: string,
    relations: string[] = ["role", "manager"],
  ): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      relations,
    });
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  create(userData: Partial<User>): User {
    return this.repository.create(userData);
  }

  async findAll(): Promise<User[]> {
    return this.repository.find();
  }

  async exists(id: number): Promise<boolean> {
    const user = await this.repository.findOne({ where: { id } });
    return !!user;
  }
}
