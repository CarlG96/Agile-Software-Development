import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { LogoutButton } from "../auth/LogoutButton";
import { useAuth } from "../auth/AuthContext";

export function ManagerHomePage() {
  useDocumentTitle("Manager - Leave Booking System");
  const { user } = useAuth();

  return (
    <main className="app-shell">
      <section className="welcome-panel role-panel" aria-labelledby="manager-home-title">
        <p className="eyebrow">Manager</p>
        <h1 id="manager-home-title">
          {user?.firstName} {user?.lastName}
        </h1>
        <LogoutButton />
      </section>
    </main>
  );
}
