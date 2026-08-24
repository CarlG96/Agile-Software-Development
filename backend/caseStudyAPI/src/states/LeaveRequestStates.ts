import { LeaveRequestState } from "./LeaveRequestState";
import { LeaveRequest } from "../entity/LeaveRequest";
import { AppDataSource } from "../data-source";
import { LeaveRequestStatus } from "../entity/LeaveRequestStatus";
import { LeaveBalance } from "../entity/LeaveBalance";

export class PendingState implements LeaveRequestState {
  async approve(request: LeaveRequest): Promise<void> {
    const statusRepo = AppDataSource.getRepository(LeaveRequestStatus);
    const balanceRepo = AppDataSource.getRepository(LeaveBalance);

    const approvedStatus = await statusRepo.findOne({
      where: { status: "Approved" },
    });
    if (!approvedStatus) throw new Error("Approved status not found");

    request.status = approvedStatus;

    // Reduce leave balance
    const balance = await balanceRepo.findOne({
      where: {
        user: { id: request.user.id },
        leaveType: { id: request.leaveType.id },
      },
    });
    if (balance) {
      balance.remaining -= request.daysRequested;
      await balanceRepo.save(balance);
    }
  }

  async reject(request: LeaveRequest): Promise<void> {
    const statusRepo = AppDataSource.getRepository(LeaveRequestStatus);
    const rejectedStatus = await statusRepo.findOne({
      where: { status: "Rejected" },
    });
    if (!rejectedStatus) throw new Error("Rejected status not found");

    request.status = rejectedStatus;
  }

  async cancel(request: LeaveRequest): Promise<void> {
    const statusRepo = AppDataSource.getRepository(LeaveRequestStatus);
    const cancelledStatus = await statusRepo.findOne({
      where: { status: "Cancelled" },
    });
    if (!cancelledStatus) throw new Error("Cancelled status not found");

    request.status = cancelledStatus;
    // No balance change since it was never approved
  }

  getStatus(): string {
    return "Pending";
  }
}

export class ApprovedState implements LeaveRequestState {
  async approve(request: LeaveRequest): Promise<void> {
    throw new Error("Cannot approve an already approved request");
  }

  async reject(request: LeaveRequest): Promise<void> {
    throw new Error("Cannot reject an already approved request");
  }

  async cancel(request: LeaveRequest): Promise<void> {
    const statusRepo = AppDataSource.getRepository(LeaveRequestStatus);
    const balanceRepo = AppDataSource.getRepository(LeaveBalance);

    const cancelledStatus = await statusRepo.findOne({
      where: { status: "Cancelled" },
    });
    if (!cancelledStatus) throw new Error("Cancelled status not found");

    request.status = cancelledStatus;

    // Restore leave balance
    const balance = await balanceRepo.findOne({
      where: {
        user: { id: request.user.id },
        leaveType: { id: request.leaveType.id },
      },
    });
    if (balance) {
      balance.remaining += request.daysRequested;
      await balanceRepo.save(balance);
    }
  }

  getStatus(): string {
    return "Approved";
  }
}

export class RejectedState implements LeaveRequestState {
  async approve(request: LeaveRequest): Promise<void> {
    throw new Error("Cannot approve a rejected request");
  }

  async reject(request: LeaveRequest): Promise<void> {
    throw new Error("Request is already rejected");
  }

  async cancel(request: LeaveRequest): Promise<void> {
    throw new Error("Cannot cancel a rejected request");
  }

  getStatus(): string {
    return "Rejected";
  }
}

export class CancelledState implements LeaveRequestState {
  async approve(request: LeaveRequest): Promise<void> {
    throw new Error("Cannot approve a cancelled request");
  }

  async reject(request: LeaveRequest): Promise<void> {
    throw new Error("Cannot reject a cancelled request");
  }

  async cancel(request: LeaveRequest): Promise<void> {
    throw new Error("Request is already cancelled");
  }

  getStatus(): string {
    return "Cancelled";
  }
}
