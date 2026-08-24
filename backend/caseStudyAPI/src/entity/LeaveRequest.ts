import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";
import { LeaveType } from "./LeaveType";
import { LeaveRequestStatus } from "./LeaveRequestStatus";
import { LeaveRequestState } from "../states/LeaveRequestState";
import {
  PendingState,
  ApprovedState,
  RejectedState,
  CancelledState,
} from "../states/LeaveRequestStates";

@Entity("leave_requests")
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => LeaveType)
  @JoinColumn({ name: "leave_type_id" })
  leaveType: LeaveType;

  @ManyToOne(() => LeaveRequestStatus)
  @JoinColumn({ name: "status_id" })
  status: LeaveRequestStatus;

  @Column({ name: "start_date", type: "date" })
  startDate: Date;

  @Column({ name: "end_date", type: "date" })
  endDate: Date;

  @CreateDateColumn({ name: "requested_on", type: "timestamp" })
  requestedOn: Date;

  // Calculate days between start and end (inclusive)
  get daysRequested(): number {
    const start =
      typeof this.startDate === "string"
        ? new Date(this.startDate)
        : this.startDate;
    const end =
      typeof this.endDate === "string" ? new Date(this.endDate) : this.endDate;

    if (!start || !end) {
      return 0;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  // State pattern methods
  private getCurrentState(): LeaveRequestState {
    switch (this.status.status) {
      case "Pending":
        return new PendingState();
      case "Approved":
        return new ApprovedState();
      case "Rejected":
        return new RejectedState();
      case "Cancelled":
        return new CancelledState();
      default:
        throw new Error("Unknown status");
    }
  }

  async approve(): Promise<void> {
    const state = this.getCurrentState();
    await state.approve(this);
  }

  async reject(): Promise<void> {
    const state = this.getCurrentState();
    await state.reject(this);
  }

  async cancel(): Promise<void> {
    const state = this.getCurrentState();
    await state.cancel(this);
  }
}
