import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { LogoutButton } from "../auth/LogoutButton";
import { useAuth } from "../auth/AuthContext";
import { OutstandingLeaveRequestList } from "./OutstandingLeaveRequestList";

export function ManagerHomePage() {
  useDocumentTitle("Manager - Leave Booking System");
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [requestRefreshKey, setRequestRefreshKey] = useState(0);

  const handleUnauthorised = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const handleRequestResolved = useCallback(() => {
    setRequestRefreshKey((currentKey) => currentKey + 1);
  }, []);

  return (
    <main className="app-shell">
      <section className="welcome-panel role-panel" aria-labelledby="manager-home-title">
        <p className="eyebrow">Manager</p>
        <h1 id="manager-home-title">
          {user?.firstName} {user?.lastName}
        </h1>
        {token && (
          <OutstandingLeaveRequestList
            token={token}
            onUnauthorised={handleUnauthorised}
            onRequestResolved={handleRequestResolved}
            refreshKey={requestRefreshKey}
          />
        )}
        <LogoutButton />
      </section>
    </main>
  );
}
