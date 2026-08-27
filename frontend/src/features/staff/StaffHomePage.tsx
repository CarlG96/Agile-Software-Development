import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { LogoutButton } from "../auth/LogoutButton";
import { useAuth } from "../auth/AuthContext";
import { LeaveBalancePanel } from "./LeaveBalancePanel";

export function StaffHomePage() {
  useDocumentTitle("Staff - Leave Booking System");

  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleUnauthorised = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  return (
    <main className="app-shell">
      <section className="welcome-panel role-panel" aria-labelledby="staff-home-title">
        <p className="eyebrow">Staff</p>
        <h1 id="staff-home-title">
          {user?.firstName} {user?.lastName}
        </h1>
        {token && (
          <LeaveBalancePanel
            token={token}
            onUnauthorised={handleUnauthorised}
          />
        )}
        <LogoutButton />
      </section>
    </main>
  );
}
