import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  cancelLeaveRequest,
  getMyLeaveRequests,
  type LeaveRequest,
} from "./api";

interface LeaveRequestListProps {
  token: string;
  onUnauthorised: () => void;
  onRequestCancelled: () => void;
  refreshKey: number;
}

export function LeaveRequestList({
  token,
  onUnauthorised,
  onRequestCancelled,
  refreshKey,
}: LeaveRequestListProps) {
  const [requests, setRequests] = useState<LeaveRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRequests() {
      setError(null);
      try {
        const response = await getMyLeaveRequests(token);
        if (active) {
          setRequests(response);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (requestError instanceof ApiError && requestError.status === 401) {
          onUnauthorised();
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load your leave requests.",
        );
      }
    }

    void loadRequests();
    return () => {
      active = false;
    };
  }, [onUnauthorised, refreshKey, token]);

  return (
    <section className="leave-requests-panel" aria-labelledby="leave-requests-title">
      <h2 id="leave-requests-title">My leave requests</h2>

      {!requests && !error && (
        <div className="loading-state" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading leave requests</span>
        </div>
      )}

      {error && (
        <p className="error-message" role="alert">
          Error: {error}
        </p>
      )}

      {requests?.length === 0 && <p className="empty-state">No leave requests yet.</p>}

      {requests && requests.length > 0 && (
        <ul className="leave-request-list">
          {requests.map((request) => (
            <li key={request.id}>
              <button
                className="leave-request-button"
                type="button"
                onClick={() => setSelectedRequest(request)}
              >
                <span>{request.leaveType.typeName}</span>
                <span>{formatDateRange(request.startDate, request.endDate)}</span>
                <span>Status: {request.status.status}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedRequest && (
        <LeaveRequestDetailsDialog
          request={selectedRequest}
          token={token}
          onClose={() => setSelectedRequest(null)}
          onUnauthorised={onUnauthorised}
          onRequestCancelled={onRequestCancelled}
        />
      )}
    </section>
  );
}

function LeaveRequestDetailsDialog({
  request,
  token,
  onClose,
  onUnauthorised,
  onRequestCancelled,
}: {
  request: LeaveRequest;
  token: string;
  onClose: () => void;
  onUnauthorised: () => void;
  onRequestCancelled: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingCancellation, setIsConfirmingCancellation] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (typeof dialog.showModal === "function" && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!dialog.open) {
      dialog.setAttribute("open", "");
    }
  }, []);

  async function handleConfirmedCancellation() {
    setError(null);
    setIsCancelling(true);

    try {
      await cancelLeaveRequest(token, request.id);
      onRequestCancelled();
      onClose();
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onUnauthorised();
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to cancel this leave request.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="leave-request-dialog"
      aria-labelledby="leave-request-details-title"
      onClose={onClose}
    >
      <h2 id="leave-request-details-title">Leave request details</h2>
      <dl className="leave-request-details">
        <div>
          <dt>Leave type</dt>
          <dd>{request.leaveType.typeName}</dd>
        </div>
        <div>
          <dt>Start date</dt>
          <dd>{formatDate(request.startDate)}</dd>
        </div>
        <div>
          <dt>End date</dt>
          <dd>{formatDate(request.endDate)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{request.status.status}</dd>
        </div>
        <div>
          <dt>Requested on</dt>
          <dd>{formatDate(request.requestedOn)}</dd>
        </div>
      </dl>
      {error && (
        <p className="error-message" role="alert">
          Error: {error}
        </p>
      )}
      {request.status.status === "Approved" && !isConfirmingCancellation && (
        <button
          className="cancel-request-button"
          type="button"
          onClick={() => setIsConfirmingCancellation(true)}
        >
          Cancel leave request
        </button>
      )}
      {request.status.status === "Approved" && isConfirmingCancellation && (
        <section
          className="cancellation-confirmation"
          aria-label="Confirm leave request cancellation"
        >
          <p role="alert">Cancel this approved leave request? This will restore the leave balance.</p>
          <button
            className="cancel-request-button"
            type="button"
            onClick={handleConfirmedCancellation}
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelling..." : "Confirm cancellation"}
          </button>
          <button
            className="keep-request-button"
            type="button"
            onClick={() => setIsConfirmingCancellation(false)}
            disabled={isCancelling}
          >
            Keep request
          </button>
        </section>
      )}
      <button className="dialog-close-button" type="button" onClick={onClose}>
        Close
      </button>
    </dialog>
  );
}

function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} to ${formatDate(endDate)}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(
    new Date(value),
  );
}