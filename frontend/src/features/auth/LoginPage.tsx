import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { roleHomeRoutes } from "./roleHomeRoutes";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";

export function LoginPage() {
  useDocumentTitle("Sign in - Leave Booking System");

  const { login } = useAuth();
  const navigate = useNavigate();

  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const authenticatedUser = await login(email, password);
      navigate(roleHomeRoutes[authenticatedUser.role], { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to sign in. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <p className="eyebrow">Leave Booking System</p>
        <h1 id="login-title">Sign in</h1>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor={emailId}>Email</label>
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
            />
          </div>

          <div className="field">
            <label htmlFor={passwordId}>Password</label>
            <input
              id={passwordId}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
            />
          </div>

          {error && (
            <p id={errorId} className="error-message" role="alert">
              Error: {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
