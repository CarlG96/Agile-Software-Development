import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { LogoutButton } from "../auth/LogoutButton";
import { useAuth } from "../auth/AuthContext";
import { AddStaffMemberForm } from "./AddStaffMemberForm";
import { LeaveUsageAnalyticsPanel } from "./LeaveUsageAnalyticsPanel";
import { LeaveAllocationPanel } from "./LeaveAllocationPanel";
import { ChangeRolePanel } from "./ChangeRolePanel";
import { OutstandingLeaveRequestList } from "./OutstandingLeaveRequestList";

const adminTabs = [
  { id: "analytics", label: "Analytics" },
  { id: "add-user", label: "Add user" },
  { id: "change-role", label: "Change role" },
  { id: "leave-requests", label: "Leave requests" },
  { id: "leave-allocation", label: "Leave allocation" },
] as const;

type AdminTabId = (typeof adminTabs)[number]["id"];

export function AdminHomePage() {
  useDocumentTitle("Admin - Leave Booking System");
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTabId>("analytics");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleUnauthorised = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = adminTabs.findIndex((tab) => tab.id === activeTab);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % adminTabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + adminTabs.length) % adminTabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = adminTabs.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      setActiveTab(adminTabs[nextIndex].id);
      const nextTab = tabRefs.current[nextIndex];
      nextTab?.focus();
      if (typeof nextTab?.scrollIntoView === "function") {
        nextTab.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
  }

  return (
    <main className="app-shell">
      <section className="welcome-panel role-panel" aria-labelledby="admin-home-title">
        <p className="eyebrow">Admin</p>
        <h1 id="admin-home-title">
          {user?.firstName} {user?.lastName}
        </h1>
        <div className="admin-tabs">
          <div className="admin-tab-list" role="tablist" aria-label="Admin features">
            {adminTabs.map((tab, index) => (
              <button
                key={tab.id}
                ref={(element) => { tabRefs.current[index] = element; }}
                className="admin-tab"
                id={`${tab.id}-tab`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={handleTabKeyDown}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            id={`${activeTab}-panel`}
            className="admin-tab-panel"
            role="tabpanel"
            aria-labelledby={`${activeTab}-tab`}
          >
            {activeTab === "analytics" && token && (
              <LeaveUsageAnalyticsPanel
                token={token}
                onUnauthorised={handleUnauthorised}
              />
            )}
            {activeTab === "add-user" && token && (
              <AddStaffMemberForm
                token={token}
                onUnauthorised={handleUnauthorised}
              />
            )}
            {activeTab === "change-role" && token && (
              <ChangeRolePanel
                token={token}
                onUnauthorised={handleUnauthorised}
              />
            )}
            {activeTab === "leave-requests" && token && (
              <OutstandingLeaveRequestList
                token={token}
                onUnauthorised={handleUnauthorised}
              />
            )}
            {activeTab === "leave-allocation" && token && (
              <LeaveAllocationPanel
                token={token}
                onUnauthorised={handleUnauthorised}
              />
            )}
          </div>
        </div>
        <LogoutButton />
      </section>
    </main>
  );
}
