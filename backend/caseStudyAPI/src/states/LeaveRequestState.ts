import { LeaveRequest } from "../entity/LeaveRequest";

export interface LeaveRequestState {
  approve(request: LeaveRequest): Promise<void>;
  reject(request: LeaveRequest): Promise<void>;
  cancel(request: LeaveRequest): Promise<void>;
  getStatus(): string;
}
