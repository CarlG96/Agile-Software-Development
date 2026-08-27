export type Role = "staff" | "manager" | "admin";

export interface AuthUser {
  userId: number;
  firstName: string;
  lastName: string;
  role: Role;
  managerId?: number | null;
}
