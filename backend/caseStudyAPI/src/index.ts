import { Server } from "../Server";
import { Router } from "express";
import { AppDataSource } from "./data-source";
import { RoleRouter } from "../routers/RoleRouter";
import { RoleController } from "../controllers/RoleController";
import { AdminRequestRouter } from "../routers/AdminRequestRouter";
import { AdminRequestController } from "../controllers/AdminRequestController";
import { AuthRouter } from "../routers/AuthRouter";
import { AuthController } from "../controllers/AuthController";
import { ManagerRequestController } from "../controllers/ManagerRequestController";
import { ManagerRequestRouter } from "../routers/ManagerRequestRouter";
import { StaffRequestController } from "../controllers/StaffRequestController";
import { StaffRequestRouter } from "../routers/StaffRequestRouter";
import {
  LeaveBalanceRepositoryFactory,
  LeaveRequestRepositoryFactory,
  LeaveRequestStatusRepositoryFactory,
  LeaveTypeRepositoryFactory,
  RoleRepositoryFactory,
  UserRepositoryFactory,
} from "./factories/Factories";
//Initialise the port
const DEFAULT_PORT = 8900;
const port = process.env.SERVER_PORT || DEFAULT_PORT;
if (!process.env.SERVER_PORT) {
  console.log(
    "PORT environment variable is not set, defaulting to " + DEFAULT_PORT,
  );
}
// Initialise the data source
const appDataSource = AppDataSource;
// Initialise routers
const adminRequestRouter = new AdminRequestRouter(
  Router(),
  new AdminRequestController(
    new UserRepositoryFactory(),
    new RoleRepositoryFactory(),
    new LeaveTypeRepositoryFactory(),
    new LeaveBalanceRepositoryFactory(),
    new LeaveRequestRepositoryFactory(),
    new LeaveRequestStatusRepositoryFactory(),
  ),
);
const authRouter = new AuthRouter(
  Router(),
  new AuthController(new UserRepositoryFactory()),
);
const managerRequestRouter = new ManagerRequestRouter(
  Router(),
  new ManagerRequestController(
    new UserRepositoryFactory(),
    new LeaveBalanceRepositoryFactory(),
    new LeaveRequestRepositoryFactory(),
    new LeaveRequestStatusRepositoryFactory(),
  ),
);
const roleRouter = new RoleRouter(
  Router(),
  new RoleController(new RoleRepositoryFactory()),
);
const staffRequestRouter = new StaffRequestRouter(
  Router(),
  new StaffRequestController(
    new UserRepositoryFactory(),
    new LeaveRequestRepositoryFactory(),
    new LeaveRequestStatusRepositoryFactory(),
    new LeaveTypeRepositoryFactory(),
    new LeaveBalanceRepositoryFactory(),
  ),
);
// Instantiate/start the server
const server = new Server(
  port,
  adminRequestRouter,
  authRouter,
  managerRequestRouter,
  roleRouter,
  staffRequestRouter,
  appDataSource,
);
server.start();
