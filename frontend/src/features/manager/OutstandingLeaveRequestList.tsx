import { useEffect, useState } from "react";
import {
  approveLeaveRequest,
  getStaffLeaveBalance,
  getOutstandingLeaveRequests,
  ManagerApiError,
  rejectLeaveRequest,
  type StaffLeaveBalance,
  type OutstandingLeaveRequest,
} from "./api";

interface OutstandingLeaveRequestListProps {
  token: string;
  onUnauthorised: () => void;
  onRequestResolved: () => void;
  refreshKey: number;
}

export function OutstandingLeaveRequestList({
  token,
  onUnauthorised,
  onRequestResolved,
  refreshKey,
}: OutstandingLeaveRequestListProps) {
  const [requests, setRequests] = useState<OutstandingLeaveRequest[] | null>(null);
  const [balancesByStaffId, setBalancesByStaffId] = useState<Record<number, StaffLeaveBalance[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<{
    requestId: number;
    type: "approve" | "reject";
  } | null>(null);
  const [resolvingRequestId, setResolvingRequestId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRequests() {
      setError(null);
      try {
        const response = await getOutstandingLeaveRequests(token);
        const pendingRequests = response.filter(
          (request) => request.status.status === "Pending",
        );
        const staffIds = [...new Set(pendingRequests.map((request) => request.user.id))];
        const balanceResponses = await Promise.all(
          staffIds.map(async (staffId) => [
            staffId,
            await getStaffLeaveBalance(token, staffId),
          ] as const),
        );

        if (active) {
          setRequests(pendingRequests);
          setBalancesByStaffId(Object.fromEntries(balanceResponses));
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (requestError instanceof ManagerApiError && requestError.status === 401) {
          onUnauthorised();
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load outstanding leave requests.",
        );
      }
    }

    void loadRequests();
    return () => {
      active = false;
    };
  }, [onUnauthorised, refreshKey, token]);

  async function handleConfirmedDecision() {
    if (!pendingDecision) {
      return;
    }

    setError(null);
    setResolvingRequestId(pendingDecision.requestId);

    try {
      if (pendingDecision.type === "approve") {
        await approveLeaveRequest(token, pendingDecision.requestId);
      } else {
        await rejectLeaveRequest(token, pendingDecision.requestId);
      }
      setPendingDecision(null);
      onRequestResolved();
    } catch (requestError) {
      if (requestError instanceof ManagerApiError && requestError.status === 401) {
        onUnauthorised();
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update the leave request.",
      );
    } finally {
      setResolvingRequestId(null);
    }
  }

  return (
    <section className="outstanding-requests-panel" aria-labelledby="outstanding-requests-title">
      <h2 id="outstanding-requests-title">Pending team leave requests</h2>

      {!requests && !error && (
        <div className="loading-state" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading pending leave requests</span>
        </div>
      )}

      {error && (
        <p className="error-message" role="alert">
          Error: {error}
        </p>
      )}

      {requests?.length === 0 && (
        <p className="empty-state">No pending leave requests.</p>
      )}

      {requests && requests.length > 0 && (
        <ul className="leave-request-list">
          {requests.map((request) => (
            <li key={request.id} className="manager-request-item">
              <span>{request.user.firstName} {request.user.lastName}</span>
              <span>{request.leaveType.typeName}</span>
              <span>{formatDateRange(request.startDate, request.endDate)}</span>
              <span>Status: {request.status.status}</span>
              <span>
                {getLeaveTypeBalance(request, balancesByStaffId) ?? "Leave balance unavailable"}
              </span>
              {pendingDecision?.requestId === request.id ? (
                <section className="manager-decision-confirmation" aria-label="Confirm leave request decision">
                  <p role="alert">
                    {pendingDecision.type === "approve"
                      ? "Approve this leave request? This will reduce the staff member's leave balance."
                      : "Reject this leave request?"}
                  </p>
                  <button
                    className={pendingDecision.type === "approve" ? "approve-request-button" : "reject-request-button"}
                    type="button"
                    onClick={() => void handleConfirmedDecision()}
                    disabled={resolvingRequestId === request.id}
                  >
                    {resolvingRequestId === request.id
                      ? "Updating..."
                      : `Confirm ${pendingDecision.type}`}
                  </button>
                  <button
                    className="keep-pending-button"
                    type="button"
                    onClick={() => setPendingDecision(null)}
                    disabled={resolvingRequestId === request.id}
                  >
                    Keep pending
                  </button>
                </section>
              ) : (
                <div className="manager-request-actions">
                  <button
                    className="approve-request-button"
                    type="button"
                    onClick={() => setPendingDecision({ requestId: request.id, type: "approve" })}
                  >
                    Approve request
                  </button>
                  <button
                    className="reject-request-button"
                    type="button"
                    onClick={() => setPendingDecision({ requestId: request.id, type: "reject" })}
                  >
                    Reject request
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatDateRange(startDate: string, endDate: string): string {
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(
      new Date(value),
    );

  return `${formatDate(startDate)} to ${formatDate(endDate)}`;
}

function getLeaveTypeBalance(
  request: OutstandingLeaveRequest,
  balancesByStaffId: Record<number, StaffLeaveBalance[]>,
): string | null {
  const balance = balancesByStaffId[request.user.id]?.find(
    (staffBalance) => staffBalance.leaveType.id === request.leaveType.id,
  );

  return balance
    ? `${balance.leaveType.typeName}: ${balance.remaining} days remaining`
    : null;
}