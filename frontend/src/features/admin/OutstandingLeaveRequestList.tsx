import { useEffect, useId, useState, type FormEvent } from "react";
import {
  AdminApiError,
  approveOutstandingLeaveRequest,
  getOutstandingLeaveRequests,
  type AdminOutstandingLeaveRequest,
} from "./api";

interface OutstandingLeaveRequestListProps {
  token: string;
  onUnauthorised: () => void;
}

export function OutstandingLeaveRequestList({
  token,
  onUnauthorised,
}: OutstandingLeaveRequestListProps) {
  const staffNameId = useId();
  const managerNameId = useId();
  const errorId = useId();
  const [staffFilter, setStaffFilter] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [filters, setFilters] = useState<{ staffName?: string; managerName?: string }>({});
  const [requests, setRequests] = useState<AdminOutstandingLeaveRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingRequestId, setConfirmingRequestId] = useState<number | null>(null);
  const [approvingRequestId, setApprovingRequestId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRequests() {
      setError(null);
      try {
        const response = await getOutstandingLeaveRequests(token, filters);
        if (active) setRequests(response);
      } catch (requestError) {
        if (!active) return;
        if (requestError instanceof AdminApiError && requestError.status === 401) {
          onUnauthorised();
          return;
        }
        setError(requestError instanceof Error ? requestError.message : "Unable to load leave requests.");
      }
    }

    void loadRequests();
    return () => { active = false; };
  }, [filters, onUnauthorised, token]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFilters({
      staffName: staffFilter.trim() || undefined,
      managerName: managerFilter.trim() || undefined,
    });
  }

  async function confirmApproval(requestId: number) {
    setError(null);
    setApprovingRequestId(requestId);
    try {
      await approveOutstandingLeaveRequest(token, requestId);
      setConfirmingRequestId(null);
      setRequests((currentRequests) => currentRequests?.filter((request) => request.id !== requestId) ?? null);
    } catch (requestError) {
      if (requestError instanceof AdminApiError && requestError.status === 401) {
        onUnauthorised();
        return;
      }
      setError(requestError instanceof Error ? requestError.message : "Unable to approve the leave request.");
    } finally {
      setApprovingRequestId(null);
    }
  }

  return (
    <section className="admin-requests-panel" aria-labelledby="admin-requests-title">
      <h2 id="admin-requests-title">Pending leave requests</h2>
      <form className="request-filter-form" onSubmit={applyFilters} noValidate>
        <div className="field"><label htmlFor={staffNameId}>Staff name</label><input id={staffNameId} value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)} aria-describedby={error ? errorId : undefined} /></div>
        <div className="field"><label htmlFor={managerNameId}>Manager name</label><input id={managerNameId} value={managerFilter} onChange={(event) => setManagerFilter(event.target.value)} aria-describedby={error ? errorId : undefined} /></div>
        <button type="submit">Apply filters</button>
      </form>
      {error && <p id={errorId} className="error-message" role="alert">Error: {error}</p>}
      {!requests && !error && <div className="loading-state" role="status"><span className="loading-spinner" aria-hidden="true" /><span>Loading leave requests</span></div>}
      {requests?.length === 0 && <p className="empty-state">No pending leave requests.</p>}
      {requests && requests.length > 0 && (
        <ul className="leave-request-list">
          {requests.map((request) => (
            <li key={request.id} className="admin-request-item">
              <span>{request.user.firstName} {request.user.lastName}</span>
              <span>{request.leaveType.typeName}</span>
              <span>{formatDateRange(request.startDate, request.endDate)}</span>
              <span>Status: {request.status.status}</span>
              {request.status.status === "Pending" && confirmingRequestId !== request.id && (
                <button className="approve-request-button" type="button" onClick={() => setConfirmingRequestId(request.id)}>Approve request</button>
              )}
              {request.status.status === "Pending" && confirmingRequestId === request.id && (
                <section className="manager-decision-confirmation" aria-label="Confirm approval">
                  <p role="alert">Approve this leave request?</p>
                  <button className="approve-request-button" type="button" onClick={() => void confirmApproval(request.id)} disabled={approvingRequestId === request.id}>
                    {approvingRequestId === request.id ? "Approving..." : "Confirm approval"}
                  </button>
                  <button className="keep-pending-button" type="button" onClick={() => setConfirmingRequestId(null)} disabled={approvingRequestId === request.id}>Keep pending</button>
                </section>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatDateRange(startDate: string, endDate: string): string {
  const formatDate = (value: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(value));
  return `${formatDate(startDate)} to ${formatDate(endDate)}`;
}