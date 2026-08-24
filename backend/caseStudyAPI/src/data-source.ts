import "reflect-metadata";
import { DataSource } from "typeorm";
import { Role } from "./entity/Role";
import { User } from "./entity/User";
import { LeaveType } from "./entity/LeaveType";
import { LeaveBalance } from "./entity/LeaveBalance";
import { LeaveRequest } from "./entity/LeaveRequest";
import { LeaveRequestStatus } from "./entity/LeaveRequestStatus";
import * as dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

export const AppDataSource = new DataSource({
  type: "mysql",
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  logging: false,
  entities: [
    Role,
    User,
    LeaveType,
    LeaveBalance,
    LeaveRequest,
    LeaveRequestStatus,
  ],
});
