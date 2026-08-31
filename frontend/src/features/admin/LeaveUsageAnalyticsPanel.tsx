import { useEffect, useState } from "react";
import {
  AdminApiError,
  getLeaveUsageAnalytics,
  type LeaveUsageAnalytics,
} from "./api";

interface LeaveUsageAnalyticsPanelProps {
  token: string;
  onUnauthorised: () => void;
}

export function LeaveUsageAnalyticsPanel({
  token,
  onUnauthorised,
}: LeaveUsageAnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<LeaveUsageAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      try {
        const response = await getLeaveUsageAnalytics(token);
        if (active) {
          setAnalytics(response);
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
            : "Unable to load leave usage analytics.",
        );
      }
    }

    void loadAnalytics();
    return () => {
      active = false;
    };
  }, [onUnauthorised, token]);

  return (
    <section className="analytics-panel" aria-labelledby="analytics-title">
      <h2 id="analytics-title">Leave usage analytics</h2>

      {!analytics && !error && (
        <div className="loading-state" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading leave usage analytics</span>
        </div>
      )}

      {error && (
        <p className="error-message" role="alert">
          Error: {error}
        </p>
      )}

      {analytics && <AnalyticsContent analytics={analytics} />}
    </section>
  );
}

function AnalyticsContent({ analytics }: { analytics: LeaveUsageAnalytics }) {
  return (
    <div className="analytics-content">
      <p className="analytics-total" aria-label={`${analytics.totalEmployees} total employees`}>
        <strong>{analytics.totalEmployees}</strong> total employees
      </p>

      <AnalyticsTable
        caption="Leave requests by status"
        headers={["Status", "Requests"]}
        rows={analytics.requestsByStatus.map((item) => [item.status, String(item.count)])}
      />
      <AnalyticsTable
        caption="Requested leave days by type and status"
        headers={["Leave type", "Status", "Days"]}
        rows={analytics.daysByTypeAndStatus.map((item) => [
          item.leaveType,
          item.status,
          String(item.totalDays),
        ])}
      />
      <AnalyticsTable
        caption="Average leave remaining by type"
        headers={["Leave type", "Average days remaining"]}
        rows={analytics.avgRemainingByType.map((item) => [
          item.leaveType,
          formatAverage(item.avgRemaining),
        ])}
      />
    </div>
  );
}

function AnalyticsTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <table className="analytics-table">
      <caption>{caption}</caption>
      <thead>
        <tr>{headers.map((header) => <th key={header} scope="col">{header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((row) => <tr key={row.join("-")}>{row.map((value) => <td key={value}>{value}</td>)}</tr>)
        ) : (
          <tr><td colSpan={headers.length}>No data available.</td></tr>
        )}
      </tbody>
    </table>
  );
}

function formatAverage(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} days`;
}