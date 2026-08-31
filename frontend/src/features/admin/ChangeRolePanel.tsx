import { useEffect, useId, useState } from "react";
import {
  AdminApiError,
  amendStaffRole,
  getRoles,
  getStaffWithLeaveAllocations,
  type Role,
  type StaffWithLeaveAllocations,
} from "./api";

interface ChangeRolePanelProps {
  token: string;
  onUnauthorised: () => void;
}

export function ChangeRolePanel({ token, onUnauthorised }: ChangeRolePanelProps) {
  const userSelectId = useId();
  const roleSelectId = useId();

  const [users, setUsers] = useState<StaffWithLeaveAllocations[] | null>(null);
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [userResponse, roleResponse] = await Promise.all([
          getStaffWithLeaveAllocations(token),
          getRoles(token),
        ]);
        if (active) {
          setUsers(userResponse);
          setRoles(roleResponse);
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
          requestError instanceof Error
            ? requestError.message
            : "Unable to load users and roles.",
        );
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [onUnauthorised, token]);

  const selectedUser = users?.find((user) => user.id === Number(selectedUserId));
  // Admins cannot be selected here to prevent accidentally locking out all admins.
  const changeableUsers = users?.filter((user) => user.role.name !== "admin");

  function handleUserChange(userId: string) {
    setSelectedUserId(userId);
    setSelectedRoleId("");
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (!selectedUser || !selectedRoleId) {
      setError("Select a user and a new role.");
      return;
    }

    if (Number(selectedRoleId) === selectedUser.role.id) {
      setError("Select a different role to make a change.");
      return;
    }

    setIsSubmitting(true);
    try {
      await amendStaffRole(token, selectedUser.id, Number(selectedRoleId));
      setUsers((currentUsers) =>
        currentUsers?.map((user) =>
          user.id !== selectedUser.id
            ? user
            : { ...user, role: roles?.find((role) => role.id === Number(selectedRoleId)) ?? user.role },
        ) ?? null,
      );
      setSuccess("Role updated.");
    } catch (requestError) {
      if (requestError instanceof AdminApiError && requestError.status === 401) {
        onUnauthorised();
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update the user's role.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="change-role-panel" aria-labelledby="change-role-title">
      <h2 id="change-role-title">Change role</h2>

      {(!users || !roles) && !error && (
        <div className="loading-state" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading users and roles</span>
        </div>
      )}

      {error && (
        <p className="error-message" role="alert">
          Error: {error}
        </p>
      )}

      {users && roles && (
        <form
          className="change-role-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
          noValidate
        >
          <div className="field">
            <label htmlFor={userSelectId}>User</label>
            <select
              id={userSelectId}
              value={selectedUserId}
              onChange={(event) => handleUserChange(event.target.value)}
            >
              <option value="">Select a user</option>
              {changeableUsers?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>

          {selectedUser && (
            <p className="current-role-note">
              Current role: <strong>{selectedUser.role.name}</strong>
            </p>
          )}

          <div className="field">
            <label htmlFor={roleSelectId}>New role</label>
            <select
              id={roleSelectId}
              value={selectedRoleId}
              onChange={(event) => setSelectedRoleId(event.target.value)}
              disabled={!selectedUser}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {success && <p className="success-message" role="status">{success}</p>}

          <button type="submit" disabled={isSubmitting || !selectedUser}>
            {isSubmitting ? "Updating role..." : "Update role"}
          </button>
        </form>
      )}
    </section>
  );
}
