import { useEffect, useState } from "react";
import { ApiError, getMyLeaveBalance, type LeaveBalance } from "./api";

interface LeaveBalancePanelProps {
  token: string;
  onUnauthorised: () => void;
  onBalancesLoaded: (balances: LeaveBalance[]) => void;
  refreshKey: number;
}

export function LeaveBalancePanel({
  token,
  onUnauthorised,
  onBalancesLoaded,
  refreshKey,
}: LeaveBalancePanelProps) {
  const [balances, setBalances] = useState<LeaveBalance[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBalances() {
      try {
        const response = await getMyLeaveBalance(token);
        if (!controller.signal.aborted) {
          setBalances(response);
          onBalancesLoaded(response);
        }
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        if (requestError instanceof ApiError && requestError.status === 401) {
          onUnauthorised();
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load your leave balance.",
        );
      }
    }

    void loadBalances();
    return () => controller.abort();
  }, [onBalancesLoaded, onUnauthorised, refreshKey, token]);

  return (
    <section className="leave-balance-panel" aria-labelledby="leave-balance-title">
      <h2 id="leave-balance-title">Leave balance</h2>

      {!balances && !error && (
        <div className="loading-state" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading leave balance</span>
        </div>
      )}

      {error && (
        <p className="error-message" role="alert">
          Error: {error}
        </p>
      )}

      {balances && (
        <dl className="leave-balance-list">
          {balances.map((balance) => (
            <div key={balance.id} className="leave-balance-item">
              <dt>{balance.leaveType.typeName}</dt>
              <dd>{balance.remaining} days remaining</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}