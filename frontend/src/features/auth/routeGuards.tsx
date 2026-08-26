import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { Role } from "./types";

// Redirects unauthenticated users back to the login page, per the security rules for JWT expiry and hard refresh.
export function RequireAuth() {
  const { status } = useAuth();

  if (status === "anonymous") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
