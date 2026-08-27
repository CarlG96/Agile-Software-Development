import { useId, useState, type FormEvent } from "react";
import { ApiError, createLeaveRequest, type LeaveBalance } from "./api";

interface LeaveRequestFormProps {
  balances: LeaveBalance[];
  token: string;
  onRequestCreated: () => void;
  onUnauthorised: () => void;
}

export function LeaveRequestForm({
  balances,
  token,
  onRequestCreated,
  onUnauthorised,
}: LeaveRequestFormProps) {
  const leaveTypeId = useId();
  const startDateId = useId();
  const endDateId = useId();
  const errorId = useId();

  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const selectedBalance = balances.find(
      (balance) => balance.leaveType.id === Number(selectedLeaveTypeId),
    );
    const validationError = validateRequest(startDate, endDate, selectedBalance);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!selectedBalance) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createLeaveRequest(token, {
        leaveTypeId: selectedBalance.leaveType.id,
        startDate,
        endDate,
      });
      setSuccess("Leave request submitted.");
      setSelectedLeaveTypeId("");
      setStartDate("");
      setEndDate("");
      onRequestCreated();
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onUnauthorised();
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit your leave request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="leave-request-panel" aria-labelledby="leave-request-title">
      <h2 id="leave-request-title">Request leave</h2>
      <form className="leave-request-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor={leaveTypeId}>Leave type</label>
          <select
            id={leaveTypeId}
            value={selectedLeaveTypeId}
            onChange={(event) => setSelectedLeaveTypeId(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            required
          >
            <option value="">Select a leave type</option>
            {balances.map((balance) => (
              <option key={balance.id} value={balance.leaveType.id}>
                {balance.leaveType.typeName} ({balance.remaining} days remaining)
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor={startDateId}>Start date</label>
          <input
            id={startDateId}
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            required
          />
        </div>

        <div className="field">
          <label htmlFor={endDateId}>End date</label>
          <input
            id={endDateId}
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            required
          />
        </div>

        {error && (
          <p id={errorId} className="error-message" role="alert">
            Error: {error}
          </p>
        )}
        {success && <p className="success-message" role="status">{success}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit leave request"}
        </button>
      </form>
    </section>
  );
}

function validateRequest(
  startDate: string,
  endDate: string,
  selectedBalance: LeaveBalance | undefined,
): string | null {
  if (!selectedBalance) {
    return "Select a leave type.";
  }

  if (!startDate || !endDate) {
    return "Enter a start date and an end date.";
  }

  const today = new Date().toISOString().slice(0, 10);
  if (startDate < today) {
    return "Leave requests cannot start before today.";
  }

  if (endDate < startDate) {
    return "The end date cannot be before the start date.";
  }

  const daysRequested = daysBetweenInclusive(startDate, endDate);
  if (daysRequested > selectedBalance.remaining) {
    return `This request needs ${daysRequested} days, but you have ${selectedBalance.remaining} days remaining.`;
  }

  return null;
}

function daysBetweenInclusive(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}