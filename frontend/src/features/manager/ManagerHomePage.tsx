import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";

export function ManagerHomePage() {
  useDocumentTitle("Manager - Leave Booking System");

  return (
    <main className="app-shell">
      <section className="welcome-panel" aria-labelledby="manager-home-title">
        <p className="eyebrow">Manager</p>
        <h1 id="manager-home-title">I&apos;m manager</h1>
      </section>
    </main>
  );
}
