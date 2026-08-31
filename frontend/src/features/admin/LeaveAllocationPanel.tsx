import { useEffect, useId, useState } from "react";
import {
  AdminApiError,
  amendLeaveAllocation,
  getStaffWithLeaveAllocations,
  type StaffWithLeaveAllocations,
} from "./api";

interface LeaveAllocationPanelProps {
  token: string;
  onUnauthorised: () => void;
}

export function LeaveAllocationPanel({
  token,
  onUnauthorised,
}: LeaveAllocationPanelProps) {
  const userSelectId = useId();
  const [users, setUsers] = useState<StaffWithLeaveAllocations[] | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadUsers() {
      try {
        const response = await getStaffWithLeaveAllocations(token);
        if (active) setUsers(response);
      } catch (requestError) {
        if (!active) return;
        if (requestError instanceof AdminApiError && requestError.status === 401) {
          onUnauthorised();
          return;
        }
        setError(requestError instanceof Error ? requestError.message : "Unable to load users.");
      }
    }
    void loadUsers();
    return () => { active = false; };
  }, [onUnauthorised, token]);

  const selectedUser = users?.find((user) => user.id === Number(selectedUserId));

  async function handleAllocationChanged(leaveTypeId: number, remaining: number) {
    if (!selectedUser) return;
    setError(null);
    setSuccess(null);
    try {
      await amendLeaveAllocation(token, selectedUser.id, leaveTypeId, remaining);
      setUsers((currentUsers) => currentUsers?.map((user) =>
        user.id !== selectedUser.id ? user : {
          ...user,
          leaveBalances: user.leaveBalances.map((balance) =>
            balance.leaveType.id === leaveTypeId ? { ...balance, remaining } : balance,
          ),
        },
      ) ?? null);
      setSuccess("Leave allocation updated.");
    } catch (requestError) {
      if (requestError instanceof AdminApiError && requestError.status === 401) {
        onUnauthorised();
        return;
      }
      setError(requestError instanceof Error ? requestError.message : "Unable to update the leave allocation.");
    }
  }

  return (
    <section className="leave-allocation-panel" aria-labelledby="leave-allocation-title">
      <h2 id="leave-allocation-title">Leave allocation</h2>
      {!users && !error && <div className="loading-state" role="status"><span className="loading-spinner" aria-hidden="true" /><span>Loading users</span></div>}
      {error && <p className="error-message" role="alert">Error: {error}</p>}
      {users && (
        <div className="allocation-content">
          <div className="field">
            <label htmlFor={userSelectId}>User</label>
            <select id={userSelectId} value={selectedUserId} onChange={(event) => { setSelectedUserId(event.target.value); setError(null); setSuccess(null); }}>
              <option value="">Select a user</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}
            </select>
          </div>
          {selectedUser && (
            <AllocationEditor
              key={selectedUser.id}
              user={selectedUser}
              onSave={handleAllocationChanged}
            />
          )}
          {success && <p className="success-message" role="status">{success}</p>}
        </div>
      )}
    </section>
  );
}

function AllocationEditor({ user, onSave }: { user: StaffWithLeaveAllocations; onSave: (leaveTypeId: number, remaining: number) => Promise<void> }) {
  const [drafts, setDrafts] = useState<Record<number, string>>(
    Object.fromEntries(user.leaveBalances.map((balance) => [balance.leaveType.id, String(balance.remaining)])),
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  return (
    <div className="allocation-editor">
      <h3>{user.firstName} {user.lastName}&apos;s leave allocations</h3>
      {validationError && <p className="error-message" role="alert">Error: {validationError}</p>}
      {user.leaveBalances.map((balance) => (
        <div className="allocation-row" key={balance.id}>
          <label htmlFor={`allocation-${balance.id}`}>{balance.leaveType.typeName}</label>
          <input id={`allocation-${balance.id}`} type="number" min="0" step="1" value={drafts[balance.leaveType.id] ?? ""} onChange={(event) => setDrafts({ ...drafts, [balance.leaveType.id]: event.target.value })} />
          <button type="button" onClick={async () => {
            const remaining = Number(drafts[balance.leaveType.id]);
            if (!Number.isInteger(remaining) || remaining < 0) {
              setValidationError("Leave allocation must be a non-negative whole number.");
              return;
            }
            setValidationError(null);
            await onSave(balance.leaveType.id, remaining);
          }}>Save allocation</button>
        </div>
      ))}
    </div>
  );
}