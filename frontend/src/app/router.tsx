import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { RequireAuth, RequireRole } from "../features/auth/routeGuards";
import { StaffHomePage } from "../features/staff/StaffHomePage";
import { ManagerHomePage } from "../features/manager/ManagerHomePage";
import { AdminHomePage } from "../features/admin/AdminHomePage";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole roles={["staff"]} />,
        children: [{ path: "/staff", element: <StaffHomePage /> }],
      },
      {
        element: <RequireRole roles={["manager"]} />,
        children: [{ path: "/manager", element: <ManagerHomePage /> }],
      },
      {
        element: <RequireRole roles={["admin"]} />,
        children: [{ path: "/admin", element: <AdminHomePage /> }],
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);
