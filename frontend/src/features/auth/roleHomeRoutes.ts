import type { Role } from "./types";

export const roleHomeRoutes: Record<Role, string> = {
  staff: "/staff",
  manager: "/manager",
  admin: "/admin",
};
