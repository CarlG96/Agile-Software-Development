import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";

export function StaffHomePage() {
  useDocumentTitle("Staff - Leave Booking System");

  return (
    <main className="app-shell">
      <section className="welcome-panel" aria-labelledby="staff-home-title">
        <p className="eyebrow">Staff</p>
        <h1 id="staff-home-title">I&apos;m staff</h1>
      </section>
    </main>
  );
}
