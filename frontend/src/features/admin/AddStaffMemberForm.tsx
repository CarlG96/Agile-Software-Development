import { useEffect, useId, useState, type FormEvent } from "react";
import {
  AdminApiError,
  createStaffMember,
  getRoles,
  type Role,
} from "./api";

interface AddStaffMemberFormProps {
  token: string;
  onUnauthorised: () => void;
}

export function AddStaffMemberForm({
  token,
  onUnauthorised,
}: AddStaffMemberFormProps) {
  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const roleId = useId();
  const managerId = useId();
  const errorId = useId();

  const [roles, setRoles] = useState<Role[] | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [manager, setManager] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRoles() {
      try {
        const response = await getRoles(token);
        if (active) {
          setRoles(response);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (requestError instanceof AdminApiError && requestError.status === 401) {
          onUnauthorised();
          return;
        }

        setError(
          requestError instanceof Error ? requestError.message : "Unable to load roles.",
        );
      }
    }

    void loadRoles();
    return () => {
      active = false;
    };
  }, [onUnauthorised, token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const managerIdValue = manager.trim() ? Number(manager) : undefined;
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !role) {
      setError("Enter all required staff details.");
      return;
    }

    if (!Number.isInteger(managerIdValue) && managerIdValue !== undefined) {
      setError("Manager ID must be a whole number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createStaffMember(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        roleId: Number(role),
        ...(managerIdValue !== undefined ? { managerId: managerIdValue } : {}),
      });
      setSuccess("Staff member added.");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setRole("");
      setManager("");
    } catch (requestError) {
      if (requestError instanceof AdminApiError && requestError.status === 401) {
        onUnauthorised();
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add the staff member.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="add-staff-panel" aria-labelledby="add-staff-title">
      <h2 id="add-staff-title">Add staff member</h2>
      {!roles && !error && (
        <div className="loading-state" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading roles</span>
        </div>
      )}
      {error && <p id={errorId} className="error-message" role="alert">Error: {error}</p>}
      {roles && (
        <form className="add-staff-form" onSubmit={handleSubmit} noValidate>
          <div className="field"><label htmlFor={firstNameId}>First name</label><input id={firstNameId} value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} required /></div>
          <div className="field"><label htmlFor={lastNameId}>Last name</label><input id={lastNameId} value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} required /></div>
          <div className="field"><label htmlFor={emailId}>Email</label><input id={emailId} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} required /></div>
          <div className="field"><label htmlFor={passwordId}>Temporary password</label><input id={passwordId} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} required /></div>
          <div className="field"><label htmlFor={roleId}>Role</label><select id={roleId} value={role} onChange={(event) => setRole(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} required><option value="">Select a role</option>{roles.map((roleOption) => <option key={roleOption.id} value={roleOption.id}>{roleOption.name}</option>)}</select></div>
          <div className="field"><label htmlFor={managerId}>Manager ID (optional)</label><input id={managerId} inputMode="numeric" value={manager} onChange={(event) => setManager(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} /></div>
          {success && <p className="success-message" role="status">{success}</p>}
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Adding staff member..." : "Add staff member"}</button>
        </form>
      )}
    </section>
  );
}