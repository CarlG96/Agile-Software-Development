import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

vi.mock("react-router-dom", () => ({
  RouterProvider: () => <div>Router mounted</div>,
}));

vi.mock("./app/router", () => ({
  router: {},
}));

describe("App", () => {
  it("mounts the configured router inside the auth provider", () => {
    render(<App />);

    expect(screen.getByText("Router mounted")).toBeInTheDocument();
  });
});