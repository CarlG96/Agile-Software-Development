import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { Role } from "./types";

// Redirects unauthenticated users after the refresh-cookie session check has completed.
export function RequireAuth() {
  const { status } = useAuth();

  if (status === "checking") {
    return <div role="status">Checking session...</div>;
  }

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
