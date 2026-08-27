import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { LogoutButton } from "../auth/LogoutButton";
import { useAuth } from "../auth/AuthContext";
import { LeaveBalancePanel } from "./LeaveBalancePanel";
import { LeaveRequestForm } from "./LeaveRequestForm";
import { LeaveRequestList } from "./LeaveRequestList";
import type { LeaveBalance } from "./api";

export function StaffHomePage() {
  useDocumentTitle("Staff - Leave Booking System");

  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [balances, setBalances] = useState<LeaveBalance[] | null>(null);
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);
  const [requestRefreshKey, setRequestRefreshKey] = useState(0);

  const handleUnauthorised = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const handleBalancesLoaded = useCallback((loadedBalances: LeaveBalance[]) => {
    setBalances(loadedBalances);
  }, []);

  const handleLeaveRequestsChanged = useCallback(() => {
    setBalanceRefreshKey((currentKey) => currentKey + 1);
    setRequestRefreshKey((currentKey) => currentKey + 1);
  }, []);

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
            onBalancesLoaded={handleBalancesLoaded}
            refreshKey={balanceRefreshKey}
          />
        )}
        {token && balances && (
          <LeaveRequestForm
            balances={balances}
            token={token}
            onRequestCreated={handleLeaveRequestsChanged}
            onUnauthorised={handleUnauthorised}
          />
        )}
        {token && (
          <LeaveRequestList
            token={token}
            onUnauthorised={handleUnauthorised}
            onRequestCancelled={handleLeaveRequestsChanged}
            refreshKey={requestRefreshKey}
          />
        )}
        <LogoutButton />
      </section>
    </main>
  );
}
