import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { LogoutButton } from "../auth/LogoutButton";
import { useAuth } from "../auth/AuthContext";

export function AdminHomePage() {
  useDocumentTitle("Admin - Leave Booking System");
  const { user } = useAuth();

  return (
    <main className="app-shell">
      <section className="welcome-panel role-panel" aria-labelledby="admin-home-title">
        <p className="eyebrow">Admin</p>
        <h1 id="admin-home-title">
          {user?.firstName} {user?.lastName}
        </h1>
        <LogoutButton />
      </section>
    </main>
  );
}
