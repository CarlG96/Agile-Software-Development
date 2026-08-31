import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import { AdminHomePage } from "./AdminHomePage";

describe("AdminHomePage", () => {
  it("provides keyboard-operable feature tabs", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AdminHomePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    const analyticsTab = screen.getByRole("tab", { name: "Analytics" });
    expect(analyticsTab).toHaveAttribute("aria-selected", "true");

    await userEvent.setup().click(screen.getByRole("tab", { name: "Add user" }));
    expect(screen.getByRole("tab", { name: "Add user" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await userEvent.setup().keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Change role" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Change role" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});