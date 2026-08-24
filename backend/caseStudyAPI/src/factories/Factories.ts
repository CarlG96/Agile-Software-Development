import { LeaveBalanceRepository } from "../repositories/LeaveBalanceRepository";
import { LeaveRequestRepository } from "../repositories/LeaveRequestRepository";
import { LeaveRequestStatusRepository } from "../repositories/LeaveRequestStatusRepository";
import { LeaveTypeRepository } from "../repositories/LeaveTypeRepository";
import { RoleRepository } from "../repositories/RoleRepository";
import { UserRepository } from "../repositories/UserRepository";

export class UserRepositoryFactory {
  createUserRepository() {
    return new UserRepository();
  }
}

export class LeaveBalanceRepositoryFactory {
  createLeaveBalanceRepository() {
    return new LeaveBalanceRepository();
  }
}

export class LeaveRequestRepositoryFactory {
  createLeaveRequestRepository() {
    return new LeaveRequestRepository();
  }
}

export class LeaveTypeRepositoryFactory {
  createLeaveTypeRepository() {
    return new LeaveTypeRepository();
  }
}

export class LeaveRequestStatusRepositoryFactory {
  createLeaveRequestStatusRepository() {
    return new LeaveRequestStatusRepository();
  }
}

export class RoleRepositoryFactory {
  createRoleRepository() {
    return new RoleRepository();
  }
}
