export type Role = "staff" | "manager" | "admin";

export interface AuthUser {
  userId: number;
  role: Role;
  managerId?: number | null;
}
