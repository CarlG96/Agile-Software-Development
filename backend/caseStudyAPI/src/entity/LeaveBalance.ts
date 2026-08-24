import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "./User";
import { LeaveType } from "./LeaveType";

@Entity("leave_balances")
@Unique(["user", "leaveType"])
export class LeaveBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => LeaveType)
  @JoinColumn({ name: "leave_type_id" })
  leaveType: LeaveType;

  @Column("int")
  remaining: number;
}
