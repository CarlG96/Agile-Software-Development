import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { LeaveBalance } from "./LeaveBalance";

@Entity("leave_types")
export class LeaveType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: "type_name" })
  typeName: string;

  @OneToMany(() => LeaveBalance, (leaveBalance) => leaveBalance.leaveType)
  balances: LeaveBalance[];
}
