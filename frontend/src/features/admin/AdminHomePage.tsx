import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";

export function AdminHomePage() {
  useDocumentTitle("Admin - Leave Booking System");

  return (
    <main className="app-shell">
      <section className="welcome-panel" aria-labelledby="admin-home-title">
        <p className="eyebrow">Admin</p>
        <h1 id="admin-home-title">I&apos;m admin</h1>
      </section>
    </main>
  );
}
