import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { LeaveRequest } from "./LeaveRequest";

@Entity("leave_request_status")
export class LeaveRequestStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  status: string;

  @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.status)
  leaveRequests: LeaveRequest[];
}
